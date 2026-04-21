import { getTrending, getTopRated, getNewReleases, getMetacriticBest, getHeroGames, searchGames } from "./api.js"
import { renderSkeletons, renderGames, initNavbar, showToast, debounce } from "./ui.js"

let heroGames = []
let heroIndex = 0

// Load hero banner
const loadHero = async () => {
    const data = await getHeroGames()
    heroGames = data.results || []
    renderHeroSlide(0)
    setInterval(() => {
        heroIndex = (heroIndex + 1) % heroGames.length
        renderHeroSlide(heroIndex)
    }, 6000)
}

const renderHeroSlide = (idx) => {
    const game = heroGames[idx]
    if (!game) return

    const bg = document.querySelector(".hero-bg")
    const title = document.querySelector(".hero-title")
    const desc = document.querySelector(".hero-desc")
    const metaRating = document.querySelector(".hero-rating")
    const metaYear = document.querySelector(".hero-year")
    const metaGenre = document.querySelector(".hero-genre")
    const detailBtn = document.querySelector(".hero-detail-btn")

    bg.style.backgroundImage = `url(${game.background_image})`
    title.textContent = game.name
    desc.textContent = game.genres?.map(g => g.name).join(" • ") || ""
    if (metaRating) metaRating.textContent = `⭐ ${game.rating?.toFixed(1) || "—"}`
    if (metaYear) metaYear.textContent = `📅 ${game.released?.slice(0, 4) || "N/A"}`
    if (metaGenre) metaGenre.textContent = `🎯 ${game.genres?.[0]?.name || ""}`
    if (detailBtn) detailBtn.href = `detail.html?id=${game.id}`

    document.querySelectorAll(".hero-dot").forEach((dot, i) => dot.classList.toggle("active", i === idx))
}

const setupHeroDots = () => {
    const wrap = document.querySelector(".hero-dots")
    if (!wrap) return
    wrap.innerHTML = ""
    for (let i = 0; i < 5; i++) {
        const btn = document.createElement("button")
        btn.className = `hero-dot ${i === 0 ? "active" : ""}`
        btn.addEventListener("click", () => {
            heroIndex = i
            renderHeroSlide(i)
        })
        wrap.appendChild(btn)
    }
}

// Load a game section
const loadSection = async (containerId, fetchFn) => {
    const container = document.getElementById(containerId)
    if (!container) return
    renderSkeletons(container, 6)
    const data = await fetchFn()
    renderGames(container, data.results)
}

// Live search dropdown
const initSearch = () => {
    const input = document.getElementById("hero-search")
    const dropdown = document.getElementById("search-dropdown")
    if (!input || !dropdown) return

    const doSearch = debounce(async (q) => {
        if (!q.trim()) {
            dropdown.classList.remove("open")
            return
        }
        dropdown.innerHTML = `<div class="dropdown-item"><span style="color:var(--text-muted);font-size:.85rem">Searching…</span></div>`
        dropdown.classList.add("open")
        try {
            const data = await searchGames(q, 6)
            renderDropdown(data.results || [])
        } catch {
            dropdown.classList.remove("open")
        }
    }, 350)

    input.addEventListener("input", e => doSearch(e.target.value))
    input.addEventListener("keydown", e => {
        if (e.key === "Enter" && input.value.trim()) {
            dropdown.classList.remove("open")
            location.href = `browse.html?search=${encodeURIComponent(input.value.trim())}`
        }
        if (e.key === "Escape") dropdown.classList.remove("open")
    })
    document.addEventListener("click", e => {
        if (!e.target.closest(".search-container")) dropdown.classList.remove("open")
    })
}

const renderDropdown = (games) => {
    const dropdown = document.getElementById("search-dropdown")
    if (!games.length) {
        dropdown.innerHTML = `<div class="dropdown-item"><span style="color:var(--text-muted)">No results found</span></div>`
        return
    }
    dropdown.innerHTML = games.map(game => `
        <div class="dropdown-item" data-id="${game.id}">
            <img class="dropdown-thumb" src="${game.background_image || ""}" alt="">
            <div class="dropdown-info">
                <div class="dropdown-name">${game.name}</div>
                <div class="dropdown-sub">⭐ ${game.rating?.toFixed(1) || "—"} · ${game.released?.slice(0, 4) || "N/A"}</div>
            </div>
        </div>
    `).join("")
    dropdown.querySelectorAll(".dropdown-item").forEach(item => {
        item.addEventListener("click", () => location.href = `detail.html?id=${item.dataset.id}`)
    })
}

// Init
window.onload = () => {
    initNavbar()
    setupHeroDots()
    loadHero()
    initSearch()
    loadSection("trending-grid", getTrending)
    loadSection("toprated-grid", getTopRated)
    loadSection("newreleases-grid", getNewReleases)
    loadSection("metacritic-grid", getMetacriticBest)
}
