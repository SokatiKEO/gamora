const STORAGE_KEY = 'gamora_reviews'

const getAllReviews = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  } catch {
    return {}
  }
}

const saveAllReviews = (all) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)


/** Return reviews for a single game, newest first */
export const getReviews = (gameId) => {
  const all = getAllReviews()
  return (all[gameId] || []).slice().sort((a, b) => b.createdAt - a.createdAt)
}

/** Create a new review */
export const addReview = (gameId, { author, rating, body }) => {
  const all = getAllReviews()
  if (!all[gameId]) all[gameId] = []
  const review = {
    id: uid(),
    gameId,
    author: author.trim() || 'Anonymous',
    rating: Number(rating),
    body: body.trim(),
    createdAt: Date.now(),
    updatedAt: null
  }
  all[gameId].unshift(review)
  saveAllReviews(all)
  return review
}

/** Update an existing review by id */
export const editReview = (gameId, reviewId, { author, rating, body }) => {
  const all = getAllReviews()
  const list = all[gameId] || []
  const idx = list.findIndex(r => r.id === reviewId)
  if (idx === -1) return null
  list[idx] = {
    ...list[idx],
    author: author.trim() || list[idx].author,
    rating: Number(rating),
    body: body.trim(),
    updatedAt: Date.now()
  }
  all[gameId] = list
  saveAllReviews(all)
  return list[idx]
}

/** Delete a review by id */
export const deleteReview = (gameId, reviewId) => {
  const all = getAllReviews()
  if (!all[gameId]) return false
  const before = all[gameId].length
  all[gameId] = all[gameId].filter(r => r.id !== reviewId)
  saveAllReviews(all)
  return all[gameId].length < before
}
