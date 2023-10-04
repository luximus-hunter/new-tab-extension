let INTERNAL_GROUPS = []

const urlIcon = (url) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=128`

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

const getBookmarkTitleFromUrl = (url) => {
    const bookmark = bookmarks.find(bookmark => bookmark.url === url)
    return bookmark ? bookmark.title : ''
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
        callback(s)
    })
}

const setSettings = (settings) => {
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