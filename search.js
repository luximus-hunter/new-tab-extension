let settings = {}
let bookmarks = []
let groups = []

const getSettings = (callback) => {
    browser.storage.local.get().then((s) => {
        if (!s.searchProvider) s.searchProvider = searchProviders[0]
        if (!s.overrideIcon) s.overrideIcon = []
        if (!s.cachedImages) s.cachedImages = []
        callback(s)
    })
}

const getBookmarks = (callback) => {
    browser.bookmarks.getTree(function(bookmarkTreeNodes) {
        try {
            populateGroups(bookmarkTreeNodes[0])
            sanitizeGroups()
        } catch (error) {
            console.log(error)
        }
        
        let bs = groups.map(group => group.links).flat()
        bs = bs.filter(b => b.url)
        bs = bs.sort((a, b) => a.title.localeCompare(b.title))

        callback(bs)
    });
}

const populateGroups = (bookmarkNode) => {
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

const openTab = (url, disposition) => {
    switch (disposition) {
        case "currentTab":
        browser.tabs.update({url});
        break;
        case "newForegroundTab":
        browser.tabs.create({url});
        break;
        case "newBackgroundTab":
        browser.tabs.create({url, active: false});
        break;
    }
}

browser.omnibox.setDefaultSuggestion({
    description: `Search your bookmarks!`
});

// Update the suggestions whenever the input is changed.
browser.omnibox.onInputChanged.addListener((text, addSuggestions) => {
    getBookmarks((bs) => {
        bs = bs.filter(b => b.title.toLowerCase().includes(text.toLowerCase()))
        const bookmarkSuggestions = bs.map(bookmark => ({content: bookmark.url, description: bookmark.title}))
        console.log(bookmarkSuggestions)
        addSuggestions(bookmarkSuggestions)
    })
});

// Open the page based on how the user clicks on a suggestion.
browser.omnibox.onInputEntered.addListener((text, disposition) => {
    getBookmarks((bs) => {
        const bookmarkByName = bs.filter(b => b.title.toLowerCase().includes(text.toLowerCase()))[0]
        const bookmarkByUrl = bs.filter(b => b.url === text)[0]
        const bookmark = bookmarkByName || bookmarkByUrl

        if (bookmark) {   
            openTab(bookmark.url, disposition)
        } else {
            getSettings((s) => {
                const url = s.searchProvider.url + text
                openTab(url, disposition)
            })
        }
    })
});

