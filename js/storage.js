const KEYS = { favorites: "gamora_favorites", wishlist: "gamora_wishlist" }

const getList = (key) => {
    try {
        return JSON.parse(localStorage.getItem(key)) || []
    } catch {
        return []
    }
}

const saveList = (key, arr) => {
    localStorage.setItem(key, JSON.stringify(arr))
    updateBadges()
}

export const getFavorites = () => {
    return getList(KEYS.favorites)
}

export const isFavorite = (id) => {
    return getFavorites().some(game => game.id === id)
}

export const toggleFavorite = (game) => {
    let list = getFavorites()
    if (list.some(item => item.id === game.id)) {
        list = list.filter(item => item.id !== game.id)
        saveList(KEYS.favorites, list)
        return false
    } else {
        list.unshift(game)
        saveList(KEYS.favorites, list)
        return true
    }
}

export const getWishlist = () => {
    return getList(KEYS.wishlist)
}

export const isWishlisted = (id) => {
    return getWishlist().some(game => game.id === id)
}

export const toggleWishlist = (game) => {
    let list = getWishlist()
    if (list.some(item => item.id === game.id)) {
        list = list.filter(item => item.id !== game.id)
        saveList(KEYS.wishlist, list)
        return false
    } else {
        list.unshift(game)
        saveList(KEYS.wishlist, list)
        return true
    }
}

export const updateBadges = () => {
    const favCount = getFavorites().length
    const wishCount = getWishlist().length
    document.querySelectorAll(".fav-badge").forEach(el => {
        el.textContent = favCount
        el.classList.toggle("visible", favCount > 0)
    })
    document.querySelectorAll(".wish-badge").forEach(el => {
        el.textContent = wishCount
        el.classList.toggle("visible", wishCount > 0)
    })
}
