import { browseGames, searchGames, getGenres } from "./api.js"
import { renderSkeletons, renderGames, initNavbar, debounce } from "./ui.js"

const PLATFORM_MAP = [
    { name: "PC", id: 4 },
    { name: "PlayStation", id: 187 },
    { name: "Xbox", id: 1 },
    { name: "Switch", id: 7 },
    { name: "iOS", id: 3 },
    { name: "Android", id: 21 },
]

let currentPage = 1
let totalCount = 0
let isLoading = false

// Initialize activeFilters with arrays to support multiselect
let activeFilters = {
    platforms: [],
    genres: []
}

// Render filter chips
const initFilters = async () => {
    // Platform multiselect logic
    renderChips("platform-chips", PLATFORM_MAP, "id", "name", (id) => {
        const val = String(id)
        const index = activeFilters.platforms.indexOf(val)
        if (index > -1) {
            activeFilters.platforms.splice(index, 1)
        } else {
            activeFilters.platforms.push(val)
        }
    })

    try {
        const data = await getGenres()
        // Genre multiselect logic
        renderChips("genre-chips", data.results.slice(0, 12), "id", "name", (id) => {
            const val = String(id)
            const index = activeFilters.genres.indexOf(val)
            if (index > -1) {
                activeFilters.genres.splice(index, 1)
            } else {
                activeFilters.genres.push(val)
            }
        })
    } catch (e) {
        console.error("Error loading genres:", e)
    }
}

const renderChips = (containerId, items, valueKey, labelKey, onToggle) => {
    const wrap = document.getElementById(containerId)
    if (!wrap) return
    wrap.innerHTML = ""
    items.forEach(item => {
        const btn = document.createElement("button")
        btn.className = "filter-chip"
        btn.textContent = item[labelKey]
        btn.dataset.value = item[valueKey]
        
        btn.addEventListener("click", () => {
            // Toggle local UI state
            btn.classList.toggle("active")
            // Update the activeFilters array
            onToggle(item[valueKey])
        })
        wrap.appendChild(btn)
    })
}

// Load games into grid
const loadGames = async (reset = true) => {
    if (isLoading) return
    isLoading = true

    const grid = document.getElementById("browse-grid")
    const countEl = document.getElementById("result-count")
    const loadMoreBtn = document.getElementById("load-more")

    if (reset) {
        currentPage = 1
        renderSkeletons(grid, 20)
    }

    const metaMin = document.getElementById("meta-min")?.value
    const metaMax = document.getElementById("meta-max")?.value
    const year = document.getElementById("filter-year")?.value
    const ordering = document.getElementById("sort-select")?.value || "-rating"
    const searchQ = document.getElementById("browse-search")?.value?.trim()

    try {
        let data
        if (searchQ) {
            data = await searchGames(searchQ, 20)
        } else {
            // Join arrays into comma-separated strings for the RAWG API
            data = await browseGames({
                platforms: activeFilters.platforms.length > 0 ? activeFilters.platforms.join(",") : undefined,
                genres: activeFilters.genres.length > 0 ? activeFilters.genres.join(",") : undefined,
                metacriticMin: metaMin || undefined,
                metacriticMax: metaMax || undefined,
                year: year || undefined,
                ordering,
                page: currentPage,
            })
        }

        totalCount = data.count || 0
        if (reset) grid.innerHTML = ""
        renderGames(grid, data.results)

        if (countEl) {
            countEl.innerHTML = `Showing <span>${grid.children.length}</span> of <span>${totalCount.toLocaleString()}</span> games`
        }
        if (loadMoreBtn) {
            loadMoreBtn.style.display = data.next ? "inline-flex" : "none"
        }
    } catch (e) {
        grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1;padding:2rem">Failed to load games. Check your API key in js/api.js</p>`
    } finally {
        isLoading = false
    }
}

// Init
window.onload = () => {
    initNavbar()
    initFilters()

    const params = new URLSearchParams(location.search)
    const q = params.get("search")
    if (q) {
        const searchInput = document.getElementById("browse-search")
        if (searchInput) searchInput.value = q
    }

    loadGames()

    document.getElementById("filter-apply")?.addEventListener("click", () => loadGames())
    
    document.getElementById("filter-reset")?.addEventListener("click", () => {
        // Clear multiselect arrays
        activeFilters = { platforms: [], genres: [] }
        
        document.querySelectorAll(".filter-chip").forEach(chip => chip.classList.remove("active"))
        if(document.getElementById("meta-min")) document.getElementById("meta-min").value = ""
        if(document.getElementById("meta-max")) document.getElementById("meta-max").value = ""
        if(document.getElementById("filter-year")) document.getElementById("filter-year").value = ""
        if(document.getElementById("sort-select")) document.getElementById("sort-select").value = "-rating"
        if(document.getElementById("browse-search")) document.getElementById("browse-search").value = ""
        
        loadGames()
    })

    document.getElementById("load-more")?.addEventListener("click", () => {
        currentPage++
        loadGames(false)
    })

    document.getElementById("sort-select")?.addEventListener("change", () => loadGames())

    document.getElementById("filter-toggle")?.addEventListener("click", () => {
        document.querySelector(".filter-sidebar")?.classList.toggle("open")
    })

    const browseSearch = document.getElementById("browse-search")
    if (browseSearch) {
        browseSearch.addEventListener("keydown", e => {
            if (e.key === "Enter") loadGames()
        })
    }
}