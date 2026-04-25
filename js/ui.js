import { isFavorite, isWishlisted, toggleFavorite, toggleWishlist, updateBadges } from "./storage.js"
import { getReviews, addReview, editReview, deleteReview } from "./reviews.js"

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

// ============================================================
//  REVIEWS UI
// ============================================================

const escHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const starsHtml = (rating, size = "sm") =>
    Array.from({ length: 5 }, (_, i) =>
        `<span class="star-display ${i < rating ? "filled" : ""} ${size}">${i < rating ? "★" : "☆"}</span>`
    ).join("")

const timeAgo = (ts) => {
    const diff = Date.now() - ts
    const m = Math.floor(diff / 60000)
    const h = Math.floor(m / 60)
    const d = Math.floor(h / 24)
    if (d > 0) return `${d}d ago`
    if (h > 0) return `${h}h ago`
    if (m > 0) return `${m}m ago`
    return "just now"
}

let _gameId = null
let _editingId = null
let _pickedRating = 0

const setPickedRating = (val) => {
    _pickedRating = val
    const ratingInput = document.getElementById("review-rating")
    if (ratingInput) ratingInput.value = val
    document.querySelectorAll(".star-btn").forEach(s => {
        s.classList.toggle("active", Number(s.dataset.value) <= val)
    })
}

const renderReviews = () => {
    const reviews = getReviews(_gameId)
    const summaryEl = document.getElementById("review-summary")
    const reviewsList = document.getElementById("reviews-list")
    if (!reviewsList) return

    if (reviews.length === 0) {
        if (summaryEl) summaryEl.style.display = "none"
        reviewsList.innerHTML = "<p class=\"reviews-empty\">No reviews yet. Be the first to share your thoughts!</p>"
        return
    }

    const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    if (summaryEl) {
        summaryEl.style.display = "flex"
        document.getElementById("review-avg-score").textContent = avg.toFixed(1)
        document.getElementById("review-stars-display").innerHTML = starsHtml(Math.round(avg), "md")
        document.getElementById("review-count").textContent = `${reviews.length} review${reviews.length !== 1 ? "s" : ""}`
    }

    reviewsList.innerHTML = reviews.map(r => `
        <div class="review-card" data-id="${r.id}">
            <div class="review-card-header">
                <div class="review-avatar">${r.author.charAt(0).toUpperCase()}</div>
                <div class="review-meta">
                    <span class="review-author">${escHtml(r.author)}</span>
                    <span class="review-time">${timeAgo(r.createdAt)}${r.updatedAt ? " · edited" : ""}</span>
                </div>
                <div class="review-stars-inline">${starsHtml(r.rating)}</div>
                <div class="review-actions">
                    <button class="review-edit-btn" data-id="${r.id}" title="Edit"><i class="fa fa-pencil" aria-hidden="true"></i></button>
                    <button class="review-delete-btn" data-id="${r.id}" title="Delete"><i class="fa fa-trash-o" aria-hidden="true"></i></button>
                </div>
            </div>
            <p class="review-body">${escHtml(r.body)}</p>
        </div>
    `).join("")

    reviewsList.querySelectorAll(".review-edit-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const review = getReviews(_gameId).find(r => r.id === btn.dataset.id)
            if (review) openReviewModal("edit", review)
        })
    })

    reviewsList.querySelectorAll(".review-delete-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            if (!confirm("Delete this review?")) return
            deleteReview(_gameId, btn.dataset.id)
            showToast("Review deleted", "warning")
            renderReviews()
        })
    })
}

const openReviewModal = (mode = "create", review = null) => {
    _editingId = null
    setPickedRating(0)
    const authorInput = document.getElementById("review-author")
    const bodyInput = document.getElementById("review-body")
    const charCount = document.getElementById("char-count")
    const modalTitle = document.getElementById("review-modal-title")
    const submitBtn = document.getElementById("review-submit")
    const overlay = document.getElementById("review-modal-overlay")

    authorInput.value = ""
    bodyInput.value = ""
    charCount.textContent = "0"

    if (mode === "edit" && review) {
        _editingId = review.id
        modalTitle.textContent = "Edit Review"
        submitBtn.textContent = "Save Changes"
        authorInput.value = review.author
        bodyInput.value = review.body
        charCount.textContent = review.body.length
        setPickedRating(review.rating)
    } else {
        modalTitle.textContent = "Write a Review"
        submitBtn.textContent = "Submit Review"
    }

    overlay.classList.add("active")
    authorInput.focus()
}

export const initReviews = (gameId) => {
    _gameId = gameId

    // star picker
    document.querySelectorAll(".star-btn").forEach(star => {
        star.addEventListener("mouseenter", () => {
            document.querySelectorAll(".star-btn").forEach(s =>
                s.classList.toggle("hover", Number(s.dataset.value) <= Number(star.dataset.value))
            )
        })
        star.addEventListener("mouseleave", () => {
            document.querySelectorAll(".star-btn").forEach(s => s.classList.remove("hover"))
        })
        star.addEventListener("click", () => setPickedRating(Number(star.dataset.value)))
    })

    // char counter
    const bodyInput = document.getElementById("review-body")
    const charCount = document.getElementById("char-count")
    if (bodyInput && charCount) {
        bodyInput.addEventListener("input", () => { charCount.textContent = bodyInput.value.length })
    }

    // open / close modal
    const overlay = document.getElementById("review-modal-overlay")
    document.getElementById("open-review-modal")?.addEventListener("click", () => openReviewModal("create"))
    document.getElementById("review-modal-close")?.addEventListener("click", () => overlay.classList.remove("active"))
    overlay?.addEventListener("click", (e) => { if (e.target === overlay) overlay.classList.remove("active") })
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") overlay?.classList.remove("active") })

    // submit
    document.getElementById("review-submit")?.addEventListener("click", () => {
        const author = document.getElementById("review-author").value.trim() || "Anonymous"
        const body   = document.getElementById("review-body").value.trim()
        const rating = _pickedRating

        if (rating === 0) { showToast("Please pick a star rating", "warning"); return }
        if (!body)        { showToast("Please write something", "warning");     return }

        if (_editingId) {
            editReview(_gameId, _editingId, { author, rating, body })
            showToast("Review updated!", "success")
        } else {
            addReview(_gameId, { author, rating, body })
            showToast("Review added!", "success")
        }

        overlay.classList.remove("active")
        _editingId = null
        renderReviews()
    })

    renderReviews()
}