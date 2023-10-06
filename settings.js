const searchProvidersSelector = document.getElementById("search-providers")
const overrideIconsSelector = document.getElementById("override-icons")
const overrideIconFile = document.getElementById("override-icon-file")
const overrideIconFileButton = document.getElementById("override-icon-file-button")
const overrideIconUrl = document.getElementById("override-icon-url")
const overrideIconButton = document.getElementById("override-icon-button")
const overriddenIcons = document.getElementById("overridden-icons")
const cachedImageSize = document.getElementById("cached-image-size")
const clearCacheButton = document.getElementById("clear-cache-button")

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
            settings.overrideIcon = settings.overrideIcon.map(oi => {
                const bookmark = allBookmarks.find(b => b.url === oi.url)
                return {...oi, title: bookmark.title}
            })

            settings.cachedImages = settings.cachedImages.filter(ci => allBookmarks.map(b => b.icon).includes(ci.url))

            setSettings(settings)

            loaded()
        })
    })
})

const loaded = () => {
    populateSearchProvidersSelector()
    populateOverrideIconsSelector()

    overrideIconsSelector.value = "0"
    cachedImageSize.value = settings.cachedImageSize

    if (settings.searchProvider) {
        searchProvidersSelector.value = settings.searchProvider.name
    }

    searchProvidersSelector.addEventListener("change", onSearchProviderChange)
    overrideIconsSelector.addEventListener("change", onOverrideIconsChange)
    overrideIconButton.addEventListener("click", onOverrideIconButtonClick)
    cachedImageSize.addEventListener("keyup", onCachedImageSizeKeyUp)
    clearCacheButton.addEventListener("click", clearCache)
    overrideIconFileButton.addEventListener("click", () => overrideIconFile.click())

    renderLinks(settings.overrideIcon, overriddenIcons, false, deleteOverrideIcon)
}

const onCachedImageSizeKeyUp = (event) => {
    const value = event.target.value
    if (value === '') return
    if (isNaN(value)) return

    settings.cachedImageSize = parseInt(value)
    setSettings(settings)
}

const clearCache = () => {
    settings.cachedImages = []
    setSettings(settings)
}

const populateSearchProvidersSelector = () => {
    clearChildren(searchProvidersSelector)

    const defaultOption = document.createElement("option")
    defaultOption.value = "0"
    defaultOption.innerText = "Select Search Provider"
    defaultOption.selected = true
    defaultOption.disabled = true
    searchProvidersSelector.appendChild(defaultOption)

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

    const defaultOption = document.createElement("option")
    defaultOption.value = "0"
    defaultOption.innerText = "Select Bookmark"
    defaultOption.selected = true
    defaultOption.disabled = true
    overrideIconsSelector.appendChild(defaultOption)

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
        clearFields()
        populateOverrideIconsSelector()
        renderOverriddenIcons()
    } else {
        const reader = new FileReader()
        reader.readAsDataURL(image)
        reader.onload = () => {
            const overrideIcon = reader.result
    
            settings = {...settings, overrideIcon: [...settings.overrideIcon, {url: selectedBookmark, icon: overrideIcon}]}
            bookmarks = bookmarks.filter(bookmark => bookmark.url !== selectedBookmark)
    
            setSettings(settings)
            clearFields()
            populateOverrideIconsSelector()
            renderOverriddenIcons()
        }
    }
}

const clearFields = () => {
    overrideIconFile.value = ''
    overrideIconUrl.value = ''
    overrideIconsSelector.value = "0"
}

const deleteOverrideIcon = (url) => {
    settings.overrideIcon = settings.overrideIcon.filter(oi => oi.url !== url)
    bookmarks = [...bookmarks, allBookmarks.find(bookmark => bookmark.url === url)]

    setSettings(settings)
    clearFields()
    populateOverrideIconsSelector()
    renderOverriddenIcons()
}

const renderOverriddenIcons = () => {
    settings.overrideIcon = settings.overrideIcon.map(oi => {
        const bookmark = allBookmarks.find(b => b.url === oi.url)
        return {...oi, title: bookmark.title}
    })
    settings.overrideIcon = settings.overrideIcon.sort((a, b) => a.title.localeCompare(b.title))
    renderLinks(settings.overrideIcon, overriddenIcons, false, deleteOverrideIcon)
    getColors()
}