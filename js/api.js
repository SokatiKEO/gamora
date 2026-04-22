const API_KEY = ""
const BASE = "https://api.rawg.io/api"

// Game list endpoints
export const getTrending = async (page = 1) => {
    const res = await fetch(`${BASE}/games?key=${API_KEY}&ordering=-added&page_size=12&page=${page}`)
    return res.json()
}

export const getTopRated = async (page = 1) => {
    const res = await fetch(`${BASE}/games?key=${API_KEY}&ordering=-rating&page_size=12&page=${page}`)
    return res.json()
}

export const getNewReleases = async (page = 1) => {
    const now = new Date()
    const from = `${now.getFullYear() - 1}-01-01`
    const to = `${now.getFullYear()}-12-31`
    const res = await fetch(`${BASE}/games?key=${API_KEY}&ordering=-released&dates=${from},${to}&page_size=12&page=${page}`)
    return res.json()
}

export const getMetacriticBest = async (page = 1) => {
    const res = await fetch(`${BASE}/games?key=${API_KEY}&ordering=-metacritic&metacritic=80,100&page_size=12&page=${page}`)
    return res.json()
}

export const getHeroGames = async () => {
    const res = await fetch(`${BASE}/games?key=${API_KEY}&ordering=-rating&page_size=5&metacritic=85,100`)
    return res.json()
}

// Search games by query
export const searchGames = async (query, page_size = 6) => {
    const res = await fetch(`${BASE}/games?key=${API_KEY}&search=${query}&page_size=${page_size}&search_precise=true`)
    return res.json()
}

// Browse with filters
export const browseGames = async ({ platforms, genres, metacriticMin, metacriticMax, year, ordering = "-rating", page = 1 } = {}) => {
    const params = new URLSearchParams({
        key: API_KEY,
        ordering,
        page_size: 20,
        page
    })

    if (platforms) params.append("platforms", platforms)
    if (genres) params.append("genres", genres)
    
    if (metacriticMin || metacriticMax) {
        params.append("metacritic", `${metacriticMin || 0},${metacriticMax || 100}`)
    }
    
    if (year) {
        params.append("dates", `${year}-01-01,${year}-12-31`)
    }

    const res = await fetch(`${BASE}/games?${params.toString()}`)
    return res.json()
}

// Single game
export const getGame = async (id) => {
    const res = await fetch(`${BASE}/games/${id}?key=${API_KEY}`)
    return res.json()
}

export const getGameSeries = async (id) => {
    const res = await fetch(`${BASE}/games/${id}/game-series?key=${API_KEY}&page_size=6`)
    return res.json()
}

export const getGameScreenshots = async (id) => {
    const res = await fetch(`${BASE}/games/${id}/screenshots?key=${API_KEY}&page_size=9`)
    return res.json()
}

// Metadata
export const getPlatforms = async () => {
    const res = await fetch(`${BASE}/platforms?key=${API_KEY}&ordering=-games_count&page_size=20`)
    return res.json()
}

export const getGenres = async () => {
    const res = await fetch(`${BASE}/genres?key=${API_KEY}&ordering=-games_count&page_size=20`)
    return res.json()
}

export const getSimilarByGenre = async (id) => {
    const gameRes = await fetch(`${BASE}/games/${id}?key=${API_KEY}`)
    const game = await gameRes.json()

    const genres = game.genres?.map(g => g.id).join(",")
    const platforms = game.parent_platforms?.map(p => p.platform.id).join(",")

    const res = await fetch(`${BASE}/games?key=${API_KEY}&genres=${genres}&platforms=${platforms}&ordering=-rating&page_size=6`)
    return res.json()
}