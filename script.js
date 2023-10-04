const urlIcon = (url) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`
const searchUrl = 'https://www.duckduckgo.com/?q='

const colorThief = new ColorThief();

const searchInput = document.getElementById('search')
const groupContainer = document.getElementById('groups')
const resultsContainer = document.getElementById('results')
resultsContainer.classList.add('links-container')

let groups = []
let colors = []
let bookmarks = []

browser.bookmarks.getTree(function(bookmarkTreeNodes) {
    try {
        const root = bookmarkTreeNodes[0]
        populateGroups(root)
        sanitizeGroups()
    } catch (error) {
        console.log(error)
    }

    loaded()
});

const populateGroups = (bookmarkNode) => {
    // transform bookmarks into a flat array
    if (bookmarkNode.children) {
        bookmarkNode.children.forEach(child => {
            if (child.children) {
                groups.push({title: child.title, links: []})
                groups = groups.filter((group, index, self) => self.findIndex(t => t.title === group.title) === index)
                populateGroups(child)
            } else {
                const bookmark = {title: child.title, url: child.url, icon: child.iconUrl, id: child.id}
                const group = groups.find(group => group.title === bookmarkNode.title)
                if (group.links.map(link => link.url).includes(bookmark.url)) return
                group.links.push(bookmark)
                bookmarks.push(child)
            }
        })
    }
}

const sanitizeGroups = () => {
    groups.forEach(group => {
        group.links = group.links.filter(link => link.url)
        group.links = group.links.sort((a, b) => a.title.localeCompare(b.title))
    })
    groups = groups.filter(group => group.links.length > 0)
    groups = groups.sort((a, b) => a.title.localeCompare(b.title))
}

const loaded = () => {
    searchInput.addEventListener('keyup', searchOnKeyUp)
    searchInput.addEventListener('keypress', searchOnKeyPress)
    searchInput.focus()
    renderGroups(groups)
}

const searchOnKeyUp = () => {
    const query = searchInput.value
    if (query.length > 0) {
        clearChildren(groupContainer)
        resultsContainer.classList.remove('hidden')
        groupContainer.classList.add('hidden')
        search(query)
    } else {
        clearChildren(resultsContainer)
        groupContainer.classList.remove('hidden')
        resultsContainer.classList.add('hidden')
        renderGroups(groups)
    }
}

const searchOnKeyPress = (event) => {
    if (!event) event = window.event;

    const keyCode = event.code || event.key;
    if (keyCode == 'Enter'){
        event.preventDefault()
        if (getLinkCount() < 1) {
            location.href = searchUrl + searchInput.value
        } else {  
            searchInput.value = ''
            goToFirstLink()
        }
    }
}

const search = (query) => {
    const links = groups.reduce((acc, group) => {
        const found = group.links.filter(link => link.title.toLowerCase().includes(query.toLowerCase()) || link.url.toLowerCase().includes(query.toLowerCase()))
        return [...acc, ...found]
    }, [])
    clearChildren(resultsContainer)
    renderLinks(links, resultsContainer)
    getColors()
}

const renderGroups = (groups) => {
    clearChildren(groupContainer)

    groups.forEach(group => {
        const title = document.createElement('h1')
        title.innerText = group.title

        const container = document.createElement('div')
        container.className = 'links-container'

        renderLinks(group.links, container)

        groupContainer.appendChild(title)
        groupContainer.appendChild(container)
    })
    getColors()
}

const renderLinks = (links, container) => {
    clearChildren(container)
    links.forEach(link => {
        const linkA = document.createElement('a')
        linkA.className = 'link-card'
        linkA.href = link.url

        const linkIcon = document.createElement('img')
        linkIcon.crossOrigin = 'Anonymous';
        linkIcon.alt = link.title
        linkIcon.src = urlIcon(link.icon ? link.icon : link.url);

        linkA.appendChild(linkIcon)

        const linkSpan = document.createElement('span')
        linkSpan.innerText = link.title
        linkA.appendChild(linkSpan)

        container.appendChild(linkA)
    })
}

const goToFirstLink = () => {
    const firstLink = document.querySelector('a')
    if (firstLink) {
        firstLink.click()
    }
}

const getLinkCount = () => {
    return document.querySelectorAll('a').length
} 

const clearChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.lastChild);
  }
}

const getColors = () => {
    document.querySelectorAll('img').forEach(img => {      
        if (!img) return

        if (colors.map(item => item.url).includes(img.src)) {
            const color = colors.find(item => item.url === img.src)
            setColors(img, color.color)
        } else {
            if (img.complete) {
                let color = colorThief.getColor(img);
                setColors(img, rgbToHex(color[0], color[1], color[2]))
                colors.push({url: img.src, color: rgbToHex(color[0], color[1], color[2])})
            } else {
                img.addEventListener('load', function() {
                    let color = colorThief.getColor(img);
                    setColors(img, rgbToHex(color[0], color[1], color[2]))
                    colors.push({url: img.src, color: rgbToHex(color[0], color[1], color[2])})
                });
            }
        }
    })
}

const setColors = (element, color) => {
    element.parentNode.style.backgroundColor = color.toLowerCase()
    element.parentNode.style.color = contrastingColor(color.replace('#', '')).toLowerCase()
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