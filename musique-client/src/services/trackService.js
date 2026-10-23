const CACHE_KEY = 'musique_tracks'
const CACHE_TIME_KEY = 'musique_tracks_time'
const CACHE_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

export const getCachedTracks = () => {
  try {
    const time = localStorage.getItem(CACHE_TIME_KEY)
    const now = Date.now()
    if (!time || now - parseInt(time) > CACHE_EXPIRY) return null
    const data = localStorage.getItem(CACHE_KEY)
    return data ? JSON.parse(data) : null
  } catch { return null }
}

export const cacheTracks = (tracks) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tracks))
    localStorage.setItem(CACHE_TIME_KEY, Date.now().toString())
  } catch (e) {
    console.warn('Cache failed:', e)
  }
}

export const clearCache = () => {
  localStorage.removeItem(CACHE_KEY)
  localStorage.removeItem(CACHE_TIME_KEY)
}

export const fetchAllTracks = async () => {
  const res = await fetch('/api/tracks/')
  const data = await res.json()
  if (data.status === 'success') return data.tracks
  throw new Error(data.error || 'Failed to fetch')
}