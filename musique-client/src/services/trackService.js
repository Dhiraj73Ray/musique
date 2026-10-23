import useMusicStore from '../store/musicStore'

const CACHE_KEY = 'musique_tracks'
const CACHE_TIME_KEY = 'musique_tracks_time'
const CACHE_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

// Yahan Render ka URL aayega (Vercel ki env se)
const API_BASE = 'https://musique-77n9.onrender.com'

let activeFetchPromise = null;

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
  if (activeFetchPromise) return activeFetchPromise;

  activeFetchPromise = (async () => {
    const limit = 1000
    let skip = 0 // <--- YEH LINE MISSING THI
    let total = Infinity
    const all = []

    while (all.length < total) {
      try {
        // API_BASE use kiya yahan
        const res = await fetch(`${API_BASE}/tracks/?skip=${skip}&limit=${limit}`)
        
        if (!res.ok) {
          throw new Error(`Server error: ${res.status}`)
        }

        const data = await res.json()
        if (data.status !== 'success') throw new Error('Failed to fetch')

        total = data.total
        all.push(...data.tracks)
        skip += data.tracks.length
        if (!data.tracks.length) break
        
        useMusicStore.getState().setBackendDown(false)
        
      } catch (err) {
        useMusicStore.getState().setBackendDown(true)
        throw err
      }
    }
    return all
  })()

  try {
    const result = await activeFetchPromise
    activeFetchPromise = null
    return result
  } catch (e) {
    activeFetchPromise = null
    throw e
  }
}