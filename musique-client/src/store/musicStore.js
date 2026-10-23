import { create } from 'zustand'

// 1. Tab band hone se pehle ka state load karo
const getSavedState = () => {
  try {
    const saved = localStorage.getItem('musique_state')
    return saved ? JSON.parse(saved) : null
  } catch { return null }
}

const saved = getSavedState()

const useMusicStore = create((set, get) => ({
  // Tracks Data
  tracks: [],
  originalQueue: [], // Sirf left side (A-Z) ke liye
  queue: saved?.queue || [], // Right side ka active queue
  totalTracks: 0,
  displayCount: 50, // Left side pagination (hamesha 50 se start hoga)
  
  isLoadingTracks: false,
  isSyncing: false,
  lastSynced: null,

  // Player State (LocalStorage se restore hoga)
  currentIndex: saved?.currentIndex ?? -1,
  isPlaying: false,
  isShuffled: saved?.isShuffled || false,
  loopMode: 'none',
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  isBuffering: false,

  preloadedAudios: {},
  searchQuery: '',

  // --- ACTIONS ---

  setTracks: (tracks) => set((state) => {
    let newQueue = [...tracks]
    let newIndex = -1

    // Agar pehle se koi gaana saved hai (Tab reopen hua hai)
    if (state.queue.length > 0 && state.currentIndex !== -1) {
      const savedCurrentId = state.queue[state.currentIndex]?.id
      
      if (savedCurrentId) {
        if (state.isShuffled) {
          // Shuffle ON tha: Purana shuffled queue hi rakho, par naye drive tracks se match karo
          const validIds = new Set(tracks.map(t => t.id))
          newQueue = state.queue.filter(t => validIds.has(t.id))
          newIndex = newQueue.findIndex(t => t.id === savedCurrentId)
        } else {
          // Normal mode tha: A-Z list mein dhoondo
          newIndex = tracks.findIndex(t => t.id === savedCurrentId)
        }
      }
    }

    // Fallback: Agar kuch nahi mila toh 0 index pe set karo
    if (newIndex === -1 && newQueue.length > 0) newIndex = 0

    return {
      tracks,
      originalQueue: tracks,
      queue: newQueue,
      totalTracks: tracks.length,
      currentIndex: newIndex,
      displayCount: 50 // Hamesha 50 se start karo
    }
  }),

  // Sirf left side ke pagination ke liye
  loadMore: () => set((state) => ({
    displayCount: Math.min(state.displayCount + 50, state.totalTracks)
  })),

  // Poori 3000 songs ki list shuffle karo
  toggleShuffle: () => {
    const { isShuffled, originalQueue, currentIndex, queue } = get()
    const currentTrack = queue[currentIndex]

    if (!isShuffled) {
      // Shuffle ON: Saare 3000 gaane shuffle karo
      const shuffled = [...originalQueue]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Jo gaana abhi baj raha hai, use dhoondh ke index set karo
      const newIndex = currentTrack ? shuffled.findIndex(t => t.id === currentTrack.id) : 0
      set({ isShuffled: true, queue: shuffled, currentIndex: Math.max(0, newIndex) })
    } else {
      // Shuffle OFF: Wapas A-Z normal queue
      const newIndex = currentTrack ? originalQueue.findIndex(t => t.id === currentTrack.id) : 0
      set({ isShuffled: false, queue: originalQueue, currentIndex: Math.max(0, newIndex) })
    }
  },

  // Next Track (Ab lazy loading ki zaroorat nahi, queue mein saare gaane hain)
  nextTrack: () => {
    const { queue, currentIndex, loopMode } = get()
    if (loopMode === 'one') return 
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, currentTime: 0 })
    } else if (loopMode === 'all' && queue.length > 0) {
      set({ currentIndex: 0, currentTime: 0 })
    }
  },

  prevTrack: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, currentTime: 0 })
    }
  },

  // ... Baaki ke chhote actions (setIsPlaying, setVolume, etc.) same rahenge
  setIsLoadingTracks: (val) => set({ isLoadingTracks: val }),
  setIsSyncing: (val) => set({ isSyncing: val }),
  setLastSynced: (val) => set({ lastSynced: val }),
  setCurrentIndex: (i) => set({ currentIndex: i, currentTime: 0 }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setVolume: (val) => set({ volume: val }),
  setCurrentTime: (val) => set({ currentTime: val }),
  setDuration: (val) => set({ duration: val }),
  setIsBuffering: (val) => set({ isBuffering: val }),
  setSearchQuery: (val) => set({ searchQuery: val }),

  toggleLoop: () => {
    const modes = ['none', 'one', 'all']
    const { loopMode } = get()
    const next = modes[(modes.indexOf(loopMode) + 1) % modes.length]
    set({ loopMode: next })
  },

  addPreloaded: (fileId, audio) => set((s) => ({
    preloadedAudios: { ...s.preloadedAudios, [fileId]: audio }
  })),
  getPreloaded: (fileId) => get().preloadedAudios[fileId] || null,
  removePreloaded: (fileId) => set((s) => {
    const newPreloaded = { ...s.preloadedAudios }
    delete newPreloaded[fileId]
    return { preloadedAudios: newPreloaded }
  }),
}))

// --- MAGIC: Har state change pe localStorage mein save karo ---
useMusicStore.subscribe((state) => {
  localStorage.setItem('musique_state', JSON.stringify({
    queue: state.queue,
    currentIndex: state.currentIndex,
    isShuffled: state.isShuffled
  }))
})

export default useMusicStore