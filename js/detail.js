import { getGame, getGameSeries, getGameScreenshots } from "./api.js"
import { isFavorite, isWishlisted, toggleFavorite, toggleWishlist } from "./storage.js"
import { initNavbar, initLightbox, openLightbox, showToast, renderGames } from "./ui.js"

const params = new URLSearchParams(location.search)
const GAME_ID = params.get("id")

const getMetacriticClass = (score) => {
    if (!score) return ""
    if (score >= 75) return "green"
    if (score >= 50) return "yellow"
    return "red"
}

const platformName = (p) => {
    return p.platform?.name+"," || ""
}

const loadDetail = async () => {
    if (!GAME_ID) {
        location.href = "index.html"
        return
    }

    try {
        const game = await getGame(GAME_ID)

        document.title = `${game.name}`

        document.querySelector(".detail-hero-bg").style.backgroundImage = `url(${game.background_image})`
        document.querySelector(".detail-cover").src = game.background_image || ""
        document.querySelector(".detail-cover").alt = game.name
        document.querySelector(".detail-title").textContent = game.name

        const mc = game.metacritic
        const mcBadge = document.querySelector(".metacritic-badge")
        if (mc) {
            mcBadge.textContent = mc
            mcBadge.classList.add(getMetacriticClass(mc))
        } else {
            mcBadge.style.display = "none"
        }

        document.querySelector(".hero-release").textContent = game.released || "N/A"
        document.querySelector(".hero-rating").textContent = game.rating?.toFixed(1) || "—"
        document.querySelector(".hero-playtime").textContent = game.playtime ? `${game.playtime}h` : "—"

        const favBtn = document.getElementById("detail-fav")
        const wishBtn = document.getElementById("detail-wish")
        if (isFavorite(game.id)) favBtn.classList.add("btn-active-fav")
        if (isWishlisted(game.id)) wishBtn.classList.add("btn-active-wish")

        favBtn.addEventListener("click", () => {
            const added = toggleFavorite(game)
            favBtn.classList.toggle("btn-active-fav", added)
            showToast(added ? "Added to Favorites" : "Removed from Favorites", added ? "success" : "warning")
        })

        wishBtn.addEventListener("click", () => {
            const added = toggleWishlist(game)
            wishBtn.classList.toggle("btn-active-wish", added)
            showToast(added ? "Added to Wishlist" : "Removed from Wishlist", added ? "info" : "warning")
        })

        document.getElementById("game-description").innerHTML =
            game.description || "<p>No description available.</p>"

        const infoPanel = document.getElementById("info-panel")
        const devs = game.developers?.map(d => d.name).join(", ") || "N/A"
        const pubs = game.publishers?.map(p => p.name).join(", ") || "N/A"
        const genres = game.genres?.map(g => g.name).join(", ") || "N/A"
        const platforms = game.platforms?.map(p => platformName(p)).join("  ") || "N/A"
        const esrb = game.esrb_rating?.name || "Not Rated"
        const website = game.website
            ? `<a href="${game.website}" target="_blank" style="color:var(--accent)">${game.website}</a>`
            : "N/A"

        infoPanel.innerHTML = `
            <p class="detail-panel-title">GAME INFO</p>
            <div class="detail-info-row"><span class="detail-info-label">Developer</span><span class="detail-info-value">${devs}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Publisher</span><span class="detail-info-value">${pubs}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Release Date</span><span class="detail-info-value">${game.released || "N/A"}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">ESRB</span><span class="detail-info-value"><span class="esrb-badge">${esrb}</span></span></div>
            <div class="detail-info-row"><span class="detail-info-label">Metacritic</span><span class="detail-info-value">${mc || "N/A"}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Rating</span><span class="detail-info-value">⭐ ${game.rating?.toFixed(1) || "—"} / 5</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Avg. Playtime</span><span class="detail-info-value">${game.playtime ? game.playtime + " hours" : "N/A"}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Genres</span><span class="detail-info-value">${genres}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Platforms</span><span class="detail-info-value">${platforms}</span></div>
            <div class="detail-info-row"><span class="detail-info-label">Website</span><span class="detail-info-value" style="font-size:.8rem">${website}</span></div>
        `
    } catch (e) {
        document.querySelector(".detail-title").textContent = "Game not found"
        console.error(e)
    }
}

const loadScreenshots = async () => {
    const grid = document.getElementById("screenshots-grid")
    if (!grid) return
    try {
        const data = await getGameScreenshots(GAME_ID)
        if (!data.results?.length) {
            grid.parentElement.style.display = "none"
            return
        }
        grid.innerHTML = data.results.map(s =>
            `<img class="screenshot-thumb" src="${s.image}" alt="screenshot" loading="lazy">`
        ).join("")
        grid.querySelectorAll(".screenshot-thumb").forEach(img => {
            img.addEventListener("click", () => openLightbox(img.src))
        })
    } catch {}
}

const loadSimilar = async () => {
    const grid = document.getElementById("similar-grid")
    if (!grid) return
    grid.innerHTML = `<div class="skeleton skeleton-card"></div>`.repeat(4)
    try {
        const data = await getGameSeries(GAME_ID)
        if (!data.results?.length) {
            grid.innerHTML = `<p style="color:var(--text-muted);grid-column:1/-1">No similar games found.</p>`
            return
        }
        renderGames(grid, data.results)
    } catch {}
}

window.onload = () => {
    initNavbar()
    initLightbox()
    loadDetail()
    loadScreenshots()
    loadSimilar()
}
