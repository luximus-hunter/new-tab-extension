let searchUrl = "https://duckduckgo.com/?q="

const colorThief = new ColorThief();

const searchInput = document.getElementById('search')
const groupContainer = document.getElementById('groups')
const resultsContainer = document.getElementById('results')
resultsContainer.classList.add('links-container')
const bookmarkContainer = document.getElementById('bookmarks')

let groups = []
let colors = []
let bookmarks = []
let settings = {}

getSettings((s) => {
    settings = s

    getBookmarks((g) => {
        groups = g

        allBookmarks = g.map(group => group.links).flat()
        settings.overrideIcon = settings.overrideIcon.filter(oi => allBookmarks.map(b => b.url).includes(oi.url))
        setSettings(settings)

        loaded()
    })
})

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
            location.href = settings.searchProvider.url + searchInput.value
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

        let imageUrl = ''

        if (settings.overrideIcon.map(oi => oi.url).includes(link.url)) {
            const overrideIcon = settings.overrideIcon.find(oi => oi.url === link.url)
            imageUrl = overrideIcon.icon
        } else {
            imageUrl = urlIcon(link.icon ? link.icon : link.url);
        }

        linkIcon.src = imageUrl

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
    return bookmarkContainer.querySelectorAll('a').length
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