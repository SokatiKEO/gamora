import { getFavorites, getWishlist, toggleFavorite, toggleWishlist } from "./storage.js"
import { initNavbar, renderGames, showToast } from "./ui.js"

window.onload = () => {
    initNavbar()

    const page = document.body.dataset.page
    const games = page === "favorites" ? getFavorites() : getWishlist()
    const grid = document.getElementById("collection-grid")
    const countEl = document.getElementById("collection-count")

    if (countEl) countEl.textContent = games.length

    if (!games.length) {
        grid.innerHTML = `
            <div class="empty-state" style="grid-column:1/-1">
                <div class="empty-icon">${page === "favorites" ? "♥" : "🕐"}</div>
                <div class="empty-title">Your ${page === "favorites" ? "Favorites" : "Wishlist"} is empty</div>
                <p class="empty-sub">Browse games and add them using the icons on each card.</p>
                <a href="browse.html" class="btn btn-primary">Discover Games →</a>
            </div>`
        return
    }

    renderGames(grid, games)

    grid.addEventListener("click", e => {
        const favBtn = e.target.closest(".fav-btn")
        const wishBtn = e.target.closest(".wish-btn")

        if (favBtn && page === "favorites") {
            const id = Number(favBtn.dataset.id)
            const game = games.find(g => g.id === id)
            if (game) {
                toggleFavorite(game)
                showToast(`Removed "${game.name}" from Favorites`, "warning")
                setTimeout(() => location.reload(), 500)
            }
        }

        if (wishBtn && page === "wishlist") {
            const id = Number(wishBtn.dataset.id)
            const game = games.find(g => g.id === id)
            if (game) {
                toggleWishlist(game)
                showToast(`Removed "${game.name}" from Wishlist`, "warning")
                setTimeout(() => location.reload(), 500)
            }
        }
    })
}
