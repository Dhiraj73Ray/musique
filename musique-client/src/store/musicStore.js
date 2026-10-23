import { create } from 'zustand'

const useMusicStore = create((set, get) => ({
  // Tracks
  tracks: [],
  originalQueue: [],
  queue: [],
  totalTracks: 0,
  displayCount: 50,
  isLoadingTracks: false,
  isSyncing: false,
  lastSynced: null,

  // Player
  currentIndex: 0,
  isPlaying: false,
  isShuffled: false,
  loopMode: 'none',
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  isBuffering: false,

  // Preload
  preloadedAudios: {},

  // UI
  searchQuery: '',

  // Track actions
  setTracks: (tracks) => set((state) => {
    // Agar shuffle ON hai, toh background sync pe queue ko touch mat karo
    if (state.isShuffled) {
      return {
        tracks,
        originalQueue: tracks, 
        totalTracks: tracks.length,
      }
    }
    return {
      tracks,
      originalQueue: tracks,
      queue: tracks.slice(0, state.displayCount), // Sirf loaded tracks queue mein daalo
      totalTracks: tracks.length,
    }
  }),

  setIsLoadingTracks: (val) => set({ isLoadingTracks: val }),
  setIsSyncing: (val) => set({ isSyncing: val }),
  setLastSynced: (val) => set({ lastSynced: val }),
  loadMore: () => set((state) => {
    const newDisplayCount = Math.min(state.displayCount + 50, state.totalTracks)
    
    // Agar shuffle ON hai
    if (state.isShuffled) {
      // Next 50 naye gaane nikalo
      const newSongs = state.originalQueue.slice(state.displayCount, newDisplayCount)
      const shuffledNewSongs = [...newSongs]
      
      // Sirf in naye 50 gaano ko shuffle karo
      for (let i = shuffledNewSongs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledNewSongs[i], shuffledNewSongs[j]] = [shuffledNewSongs[j], shuffledNewSongs[i]];
      }
      
      // Existing shuffled queue ke niche naye shuffled gaane append karo
      return {
        displayCount: newDisplayCount,
        queue: [...state.queue, ...shuffledNewSongs]
      }
    }

    // Agar shuffle OFF hai (Normal mode)
    return {
      displayCount: newDisplayCount,
      queue: state.originalQueue.slice(0, newDisplayCount)
    }
  }),

  // Player actions
  setCurrentIndex: (i) => set({ currentIndex: i, currentTime: 0 }),
  setIsPlaying: (val) => set({ isPlaying: val }),
  setVolume: (val) => set({ volume: val }),
  setCurrentTime: (val) => set({ currentTime: val }),
  setDuration: (val) => set({ duration: val }),
  setIsBuffering: (val) => set({ isBuffering: val }),
  setSearchQuery: (val) => set({ searchQuery: val }),

  getCurrentTrack: () => {
    const { queue, currentIndex } = get()
    return queue[currentIndex] || null
  },

    nextTrack: () => {
    const { queue, currentIndex, loopMode, displayCount, totalTracks, originalQueue, isShuffled } = get()
    
    // Loop 'one' AudioEngine khud handle karta hai
    if (loopMode === 'one') return 

    // 1. Agar queue mein agla gaana already maujood hai
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, currentTime: 0 })
      return
    }

    // 2. Agar queue khatam ho gayi hai, par Drive pe aur gaane bache hain
    if (displayCount < totalTracks) {
      const newDisplayCount = Math.min(displayCount + 50, totalTracks)
      
      // Naye 50 gaane nikalo
      const newSongs = originalQueue.slice(displayCount, newDisplayCount)
      let newQueue = [...queue]

      // Agar shuffle ON hai, toh in naye 50 gaano ko shuffle karke queue mein jodo
      if (isShuffled) {
        const shuffledNewSongs = [...newSongs]
        for (let i = shuffledNewSongs.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledNewSongs[i], shuffledNewSongs[j]] = [shuffledNewSongs[j], shuffledNewSongs[i]];
        }
        newQueue = [...newQueue, ...shuffledNewSongs]
      } else {
        // Normal mode mein seedha jodo
        newQueue = [...newQueue, ...newSongs]
      }

      // State update karo aur index ko next gaane pe le jao
      set({
        displayCount: newDisplayCount,
        queue: newQueue,
        currentIndex: currentIndex + 1,
        currentTime: 0
      })
      return
    }

    // 3. Agar saare 2994 gaane khatam ho gaye hain (End of Library)
    if (loopMode === 'all' && queue.length > 0) {
      set({ currentIndex: 0, currentTime: 0 })
    }
  },

  prevTrack: () => {
    const { currentIndex } = get()
    // Agar pehle gaane pe hain, toh index 0 hi rahega
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1, currentTime: 0 })
    }
  },

  toggleShuffle: () => {
    const { isShuffled, originalQueue, currentIndex, queue, displayCount } = get()
    const currentTrack = queue[currentIndex]

    if (!isShuffled) {
      // Shuffle ON: Sirf utne hi gaane uthao jitne screen pe load hain
      const loadedSongs = originalQueue.slice(0, displayCount)
      const shuffled = [...loadedSongs]
      
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      const newIndex = currentTrack ? shuffled.findIndex(t => t.id === currentTrack.id) : 0
      set({ isShuffled: true, queue: shuffled, currentIndex: Math.max(0, newIndex) })
    } else {
      // Shuffle OFF: Wapas normal order mein (sirf loaded tracks ke liye)
      const normalQueue = originalQueue.slice(0, displayCount)
      const newIndex = currentTrack ? normalQueue.findIndex(t => t.id === currentTrack.id) : 0
      set({ isShuffled: false, queue: normalQueue, currentIndex: Math.max(0, newIndex) })
    }
  },

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

export default useMusicStore