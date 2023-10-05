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
    links.sort((a, b) => a.title.localeCompare(b.title))
    clearChildren(resultsContainer)
    renderLinks(links, resultsContainer, true)
}

const renderGroups = (groups) => {
    clearChildren(groupContainer)

    groups.forEach(group => {
        const title = document.createElement('h2')
        title.innerText = group.title

        const container = document.createElement('div')
        container.className = 'links-container'

        renderLinks(group.links, container, true)

        groupContainer.appendChild(title)
        groupContainer.appendChild(container)
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
