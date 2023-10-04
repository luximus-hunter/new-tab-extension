const searchProvidersSelector = document.getElementById("search-providers")
const overrideIconsSelector = document.getElementById("override-icons")
const overrideIconFile = document.getElementById("override-icon-file")
const overrideIconUrl = document.getElementById("override-icon-url")
const overrideIconButton = document.getElementById("override-icon-button")
const overriddenIcons = document.getElementById("overridden-icons")

let searchProviders = []
let overrideIcons = []
let settings = {}
let allBookmarks = []
let bookmarks = []
let selectedBookmark = ''

fetch('./search_providers.json').then(response => response.json()).then(sp => {
    searchProviders = sp

    getSettings((s) => {
        settings = s

        if(!settings.overrideIcon) {
            settings.overrideIcon = []
        }

        getBookmarks((g) => {
            allBookmarks = g.map(group => group.links).flat()
            
            bookmarks = allBookmarks.filter(bookmark => {
                const overrideIcon = settings.overrideIcon.find(oi => oi.url === bookmark.url)
                if (!overrideIcon) {
                    return bookmark
                }
            })

            settings.overrideIcon = settings.overrideIcon.filter(oi => allBookmarks.map(b => b.url).includes(oi.url))
            setSettings(settings)

            loaded()
        })
    })
})

const loaded = () => {
    console.log(searchProviders, settings)

    populateSearchProvidersSelector()
    populateOverrideIconsSelector()

    overrideIconsSelector.value = "0"

    if (settings.searchProvider) {
        searchProvidersSelector.value = settings.searchProvider.name
    }

    searchProvidersSelector.addEventListener("change", onSearchProviderChange)
    overrideIconsSelector.addEventListener("change", onOverrideIconsChange)
    overrideIconButton.addEventListener("click", onOverrideIconButtonClick)

    renderOverriddenIcons()
}

const populateSearchProvidersSelector = () => {
    clearChildren(searchProvidersSelector)

    searchProviders.forEach(searchProvider => {
        const option = document.createElement("option")
        option.value = searchProvider.name
        option.innerText = searchProvider.name
        if (settings.search === searchProvider.name) option.selected = true
        searchProvidersSelector.appendChild(option)
    })
}

const onSearchProviderChange = (event) => {
    const searchProviderName = event.target.value
    const searchProvider = searchProviders.find(searchProvider => searchProvider.name === searchProviderName)
    setSettings({searchProvider})
    settings.searchProvider = searchProvider
}

const populateOverrideIconsSelector = () => {
    clearChildren(overrideIconsSelector)
    bookmarks = bookmarks.sort((a, b) => a.title.localeCompare(b.title))

    bookmarks.forEach(bookmark => {
        const option = document.createElement("option")
        option.value = bookmark.url
        option.innerText = bookmark.title
        if (settings.overrideIcons === bookmark.icon) option.selected = true
        overrideIconsSelector.appendChild(option)
    })
}

const onOverrideIconsChange = (event) => {
    selectedBookmark = event.target.value
}

const onOverrideIconButtonClick = () => {
    if (selectedBookmark == '') return
    if (settings.overrideIcon.map(oi => oi.url).includes(selectedBookmark)) return

    const image = overrideIconFile.files[0]

    if(!image) {
        settings = {...settings, overrideIcon: [...settings.overrideIcon, {url: selectedBookmark, icon: urlIcon(overrideIconUrl.value)}]}
        bookmarks = bookmarks.filter(bookmark => bookmark.url !== selectedBookmark)

        setSettings(settings)
        populateOverrideIconsSelector()
        renderOverriddenIcons()
        clearFields()
    } else {
        const reader = new FileReader()
        reader.readAsDataURL(image)
        reader.onload = () => {
            const overrideIcon = reader.result
    
            settings = {...settings, overrideIcon: [...settings.overrideIcon, {url: selectedBookmark, icon: overrideIcon}]}
            bookmarks = bookmarks.filter(bookmark => bookmark.url !== selectedBookmark)
    
            setSettings(settings)
            populateOverrideIconsSelector()
            renderOverriddenIcons()
            clearFields()
        }
    }
}

const clearFields = () => {
    overrideIconFile.value = ''
    overrideIconUrl.value = ''
    overrideIconsSelector.value = "0"
}

const renderOverriddenIcons = () => {
    clearChildren(overriddenIcons)

    settings.overrideIcon.forEach(overrideIcon => {
        const li = document.createElement("li")
        li.addEventListener("click", () => deleteOverrideIcon(overrideIcon))
        const img = document.createElement("img")
        img.src = overrideIcon.icon
        li.appendChild(img)
        const span = document.createElement("span")
        span.innerText = getBookmarkTitleFromUrl(overrideIcon.url)
        li.appendChild(span)
        overriddenIcons.appendChild(li)
    })
}

const deleteOverrideIcon = (overrideIcon) => {
    settings.overrideIcon = settings.overrideIcon.filter(oi => oi.url !== overrideIcon.url)
    bookmarks = [...bookmarks, allBookmarks.find(bookmark => bookmark.url === overrideIcon.url)]

    setSettings(settings)
    populateOverrideIconsSelector()
    renderOverriddenIcons()
    clearFields()
}