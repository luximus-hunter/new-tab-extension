let INTERNAL_GROUPS = []

const colorThief = new ColorThief();

const urlIcon = (url) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=256`

const getBookmarks = (callback) => {
    browser.bookmarks.getTree(function(bookmarkTreeNodes) {
        try {
            populateGroups(bookmarkTreeNodes[0])
            sanitizeGroups()
        } catch (error) {
            console.log(error)
        }

        callback(INTERNAL_GROUPS)
    });
}

const populateGroups = (bookmarkNode) => {
    if (bookmarkNode.children) {
        bookmarkNode.children.forEach(child => {
            if (child.children) {
                INTERNAL_GROUPS.push({title: child.title, links: []})
                INTERNAL_GROUPS = INTERNAL_GROUPS.filter((group, index, self) => self.findIndex(t => t.title === group.title) === index)
                populateGroups(child)
            } else {
                const bookmark = {title: child.title, url: child.url, icon: child.iconUrl, id: child.id}
                const group = INTERNAL_GROUPS.find(group => group.title === bookmarkNode.title)
                if (group.links.map(link => link.url).includes(bookmark.url)) return
                group.links.push(bookmark)
                bookmarks.push(child)
            }
        })
    }
}

const getBase64Image = (img) => {
    console.log("getBase64Image")

    console.log(img.src)

    if (!img) return ''
    if (img.src.includes('data:image')) return img.src

    const canvas = document.createElement("canvas");
    const width =  settings.cachedImageSize;
    const height =  settings.cachedImageSize;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    var imageData = ctx.getImageData(0,0, width, height);
    var pixels = imageData.data;

    var r=0,g=1,b=2,a=3;
    const pxThreshold = 250;
    for (var p = 0; p<pixels.length; p+=4) {
        if (pixels[p+r] >= pxThreshold && pixels[p+g] >= pxThreshold && pixels[p+b] >= pxThreshold) {
            pixels[p+a] = 0;
        }
    }

    ctx.putImageData(imageData,0,0);

    const dataURL = canvas.toDataURL("image/png");

    settings.cachedImages.push({url: img.src, image: dataURL})
    setSettings(settings)

    return dataURL
}

const setColors = (element, color) => {
    element.parentNode.style.backgroundColor = color.toLowerCase()
    element.parentNode.style.color = contrastingColor(color.replace('#', '')).toLowerCase()
}

const renderLinks = (links, container, url, action) => {
    clearChildren(container)
    links.forEach(link => {
        const linkA = document.createElement('a')
        linkA.className = 'link-card'

        if (url) linkA.href = link.url

        const linkIcon = document.createElement('img')
        linkIcon.crossOrigin = 'Anonymous';
        linkIcon.alt = link.title

        let imageUrl = ''

        if (settings.overrideIcon.map(oi => oi.url).includes(link.url)) {
            const overrideIcon = settings.overrideIcon.find(oi => oi.url === link.url)
            imageUrl = overrideIcon.icon
        } else {
            imageUrl = urlIcon(link.icon ? link.icon : link.url);
        }

        linkIcon.src = getImageFromCache(imageUrl)

        linkA.appendChild(linkIcon)

        const linkSpan = document.createElement('span')
        linkSpan.innerText = link.title
        linkA.appendChild(linkSpan)

        linkIcon.addEventListener('load', imageLoaded)
        if (action) linkA.addEventListener('click', () => action(link.url))

        container.appendChild(linkA)
    })
}

const getImageFromCache = (url) => {
    if (settings.cachedImages.map(item => item.url).includes(url)) {
        const cachedImage = settings.cachedImages.find(item => item.url === url)
        return cachedImage.image
    } else {
        return url
    }
}

const imageLoaded = (event) => {
    console.log("imageLoaded")
    const img = event.target
    img.src = getBase64Image(img)
    let color = colorThief.getColor(img);
    setColors(img, rgbToHex(color[0], color[1], color[2]))
    img.removeEventListener('load', imageLoaded)
    img.parentNode.style.opacity = 1
}

const sanitizeGroups = () => {
    INTERNAL_GROUPS.forEach(group => {
        group.links = group.links.filter(link => link.url)
        group.links = group.links.sort((a, b) => a.title.localeCompare(b.title))
    })
    INTERNAL_GROUPS = INTERNAL_GROUPS.filter(group => group.links.length > 0)
    INTERNAL_GROUPS = INTERNAL_GROUPS.sort((a, b) => a.title.localeCompare(b.title))
}

const getSettings = (callback) => {
    browser.storage.local.get().then((s) => {
        if (!s.searchProvider) s.searchProvider = searchProviders[0]
        if (!s.overrideIcon) s.overrideIcon = []
        if (!s.cachedImages) s.cachedImages = []
        callback(s)
    })
}

const setSettings = (settings) => {
    console.log(settings)
    browser.storage.local.set(settings)
}

const clearChildren = (element) => {
    while (element.firstChild) {
      element.removeChild(element.lastChild);
    }
}

const rgbToHex = (r, g, b) => '#' + [r, g, b].map(x => {
    const hex = x.toString(16)
    return hex.length === 1 ? '0' + hex : hex
}).join('')

const contrastingColor =(color) =>{
    return (luma(color) >= 165) ? '#000000' : '#ffffff';
}

const luma = (color) => {
    var rgb = (typeof color === 'string') ? hexToRGBArray(color) : color;
    return (0.2126 * rgb[0]) + (0.7152 * rgb[1]) + (0.0722 * rgb[2]); // SMPTE C, Rec. 709 weightings
}

const hexToRGBArray = (color) =>{
    if (color.length === 3)
        color = color.charAt(0) + color.charAt(0) + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2);
    else if (color.length !== 6)
        throw('Invalid hex color: ' + color);
    var rgb = [];
    for (var i = 0; i <= 2; i++)
        rgb[i] = parseInt(color.substr(i * 2, 2), 16);
    return rgb;
}