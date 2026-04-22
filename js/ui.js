import { isFavorite, isWishlisted, toggleFavorite, toggleWishlist, updateBadges } from "./storage.js"

let toastWrap = null

export const showToast = (msg, type = "info") => {
    if (!toastWrap) {
        toastWrap = document.createElement("div")
        toastWrap.className = "toast-container"
        document.body.appendChild(toastWrap)
    }
    const t = document.createElement("div")
    t.className = `toast ${type}`
    const icons = { success: "✅", info: "💜", warning: "⭐" }
    t.innerHTML = `<span>${icons[type] || "💬"}</span><span>${msg}</span>`
    toastWrap.appendChild(t)
    setTimeout(() => t.remove(), 3000)
}

// Navbar setup
export const initNavbar = () => {
    const ham = document.querySelector(".hamburger")
    const links = document.querySelector(".nav-links")
    if (ham && links) {
        ham.addEventListener("click", () => links.classList.toggle("open"))
    }
    const current = location.pathname.split("/").pop() || "index.html"
    document.querySelectorAll(".nav-links a").forEach(a => {
        const href = a.getAttribute("href")
        if (href === current || (current === "" && href === "index.html")) {
            a.classList.add("active")
        }
    })
    updateBadges()

    // Navbar scroll effect — adds solid background when scrolled past hero
    const navbar = document.querySelector(".navbar")
    if (navbar) {
        const handleScroll = () => {
            navbar.classList.toggle("scrolled", window.scrollY > 50)
        }
        window.addEventListener("scroll", handleScroll, { passive: true })
        handleScroll()
    }
}

// Render skeleton loading cards
export const renderSkeletons = (container, count = 12) => {
    container.innerHTML = Array(count).fill(
        `<div class="skeleton skeleton-card"></div>`
    ).join("")
}

// Build a single game card
export const buildCard = (game) => {
    const fav = isFavorite(game.id)
    const wish = isWishlisted(game.id)
    const img = game.background_image || "https://via.placeholder.com/320x180/0d1117/333?text=No+Image"
    const year = game.released ? game.released.slice(0, 4) : "N/A"
    const rating = game.rating ? game.rating.toFixed(1) : "—"
    const genres = (game.genres || []).slice(0, 2).map(genre =>
        `<span class="card-tag">${genre.name}</span>`
    ).join("")

    const card = document.createElement("div")
    card.className = "game-card"
    card.dataset.id = game.id
    card.innerHTML = `
        <div class="card-image-wrap">
            <img src="${img}" alt="${game.name}" loading="lazy">
            <div class="card-overlay">
                <p class="card-hover-desc">${game.genres?.map(g => g.name).join(" • ") || ""}</p>
            </div>
            <div class="card-actions">
                <button class="action-btn fav-btn ${fav ? "active" : ""}" title="Favorite" data-id="${game.id}">♥</button>
                <button class="action-btn wish-btn ${wish ? "active-wish" : ""}" title="Wishlist" data-id="${game.id}">🕐</button>
            </div>
        </div>
        <div class="card-body">
            <div class="card-title">${game.name}</div>
            <div class="card-meta">
                <span class="card-rating">⭐ ${rating}</span>
                <span>${year}</span>
            </div>
            <div class="card-tags">${genres}</div>
        </div>
    `

    card.addEventListener("click", e => {
        if (!e.target.closest(".action-btn")) {
            location.href = `detail.html?id=${game.id}`
        }
    })

    card.querySelector(".fav-btn").addEventListener("click", e => {
        e.stopPropagation()
        const added = toggleFavorite(game)
        e.currentTarget.classList.toggle("active", added)
        showToast(added ? `Added "${game.name}" to Favorites` : `Removed from Favorites`, added ? "success" : "warning")
    })

    card.querySelector(".wish-btn").addEventListener("click", e => {
        e.stopPropagation()
        const added = toggleWishlist(game)
        e.currentTarget.classList.toggle("active-wish", added)
        showToast(added ? `Added "${game.name}" to Wishlist` : `Removed from Wishlist`, added ? "info" : "warning")
    })

    return card
}

// Render a list of games into a container
export const renderGames = (container, games) => {
    container.innerHTML = ""
    if (!games || games.length === 0) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">🎮</div><div class="empty-title">No games found</div><p class="empty-sub">Try adjusting your filters</p></div>`
        return
    }
    games.forEach((game, i) => {
        const card = buildCard(game)
        card.style.animationDelay = `${i * 0.05}s`
        container.appendChild(card)
    })
}

// Screenshot lightbox
export const initLightbox = () => {
    const lb = document.getElementById("lightbox")
    if (!lb) return
    lb.querySelector(".lightbox-close").addEventListener("click", () => lb.classList.remove("open"))
    lb.addEventListener("click", e => {
        if (e.target === lb) lb.classList.remove("open")
    })
}

export const openLightbox = (src) => {
    const lb = document.getElementById("lightbox")
    if (!lb) return
    lb.querySelector("img").src = src
    lb.classList.add("open")
}

// Debounce helper
export const debounce = (fn, delay = 300) => {
    let timer
    return (...args) => {
        clearTimeout(timer)
        timer = setTimeout(() => fn(...args), delay)
    }
}
