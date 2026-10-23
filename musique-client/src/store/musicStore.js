import { create } from 'zustand'

const useMusicStore = create((set, get) => ({
  // Tracks
  tracks: [],
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
  setTracks: (tracks) => set({
    tracks,
    queue: tracks,
    totalTracks: tracks.length,
    displayCount: 50
  }),

  setIsLoadingTracks: (val) => set({ isLoadingTracks: val }),
  setIsSyncing: (val) => set({ isSyncing: val }),
  setLastSynced: (val) => set({ lastSynced: val }),
  loadMore: () => set((s) => ({
    displayCount: Math.min(s.displayCount + 50, s.totalTracks)
  })),

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
    const { queue, currentIndex, loopMode, isShuffled } = get()
    if (loopMode === 'one') { set({ currentTime: 0 }); return }
    if (isShuffled) {
      set({ currentIndex: Math.floor(Math.random() * queue.length), currentTime: 0 })
      return
    }
    if (currentIndex < queue.length - 1) {
      set({ currentIndex: currentIndex + 1, currentTime: 0 })
    } else if (loopMode === 'all') {
      set({ currentIndex: 0, currentTime: 0 })
    }
  },

  prevTrack: () => {
    const { currentIndex, currentTime } = get()
    if (currentTime > 3) { set({ currentTime: 0 }); return }
    if (currentIndex > 0) set({ currentIndex: currentIndex - 1, currentTime: 0 })
  },

  toggleShuffle: () => {
    const { isShuffled, tracks, currentIndex, queue } = get()
    const currentTrack = queue[currentIndex]
    if (!isShuffled) {
      const shuffled = [...tracks].sort(() => Math.random() - 0.5)
      const newIndex = shuffled.findIndex(t => t.id === currentTrack?.id)
      set({ isShuffled: true, queue: shuffled, currentIndex: Math.max(0, newIndex) })
    } else {
      const newIndex = tracks.findIndex(t => t.id === currentTrack?.id)
      set({ isShuffled: false, queue: tracks, currentIndex: Math.max(0, newIndex) })
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
}))

export default useMusicStore