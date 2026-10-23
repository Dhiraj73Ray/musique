import useMusicStore from '../store/musicStore'

const STREAM_BASE = '/api/stream'
const PRELOAD_AHEAD = 3

class AudioEngine {
  constructor() {
    this.audio = new Audio()
    this.audio.preload = 'auto'
    this._currentTrackId = null
    this._bindEvents()
  }

  _bindEvents() {
    const g = () => useMusicStore.getState()

    this.audio.addEventListener('timeupdate', () => {
      g().setCurrentTime(this.audio.currentTime)
      const pct = this.audio.currentTime / (this.audio.duration || 1)
      if (pct > 0.6) this._preloadUpcoming()
    })

    this.audio.addEventListener('loadedmetadata', () => {
      g().setDuration(this.audio.duration)
    })

    this.audio.addEventListener('waiting', () => g().setIsBuffering(true))
    this.audio.addEventListener('canplay', () => g().setIsBuffering(false))
    this.audio.addEventListener('playing', () => {
      g().setIsBuffering(false)
      g().setIsPlaying(true)
      g().setNetworkError(null) // Clear errors on play
    })

    // Error Handling (Network fail ya Stream fail)
    this.audio.addEventListener('error', () => {
      g().setIsBuffering(false)
      g().setIsPlaying(false)
      if (this.audio.src) {
        g().setNetworkError("Failed to load track. Check network.")
        setTimeout(() => g().setNetworkError(null), 4000)
      }
    })

    this.audio.addEventListener('ended', () => {
      const { loopMode, nextTrack } = g()
      if (this.audio.duration > 0 && this.audio.currentTime >= this.audio.duration - 1) {
        if (loopMode === 'one') {
          this.audio.currentTime = 0
          this.audio.play().catch(console.error)
        } else {
          nextTrack()
        }
      }
    })

    this.audio.addEventListener('pause', () => {
      if (!this.audio.ended) g().setIsPlaying(false)
    })

    let lastIndex = -1
    useMusicStore.subscribe((state) => {
      if (state.currentIndex !== lastIndex) {
        lastIndex = state.currentIndex
        const track = state.queue[state.currentIndex]
        if (track) {
          if (this._currentTrackId === null) {
            this._currentTrackId = track.id
          } else {
            this.loadAndPlay(track)
          }
        }
      }
    })

    useMusicStore.subscribe((state) => {
      this.audio.volume = state.volume
    })
  }

  loadAndPlay(track) {
    if (this._currentTrackId === track.id && this.audio.src) {
      this.audio.play().catch(e => {
        useMusicStore.getState().setIsPlaying(false)
        console.warn("Autoplay blocked:", e)
      })
      return
    }

    this._currentTrackId = track.id
    const preloaded = useMusicStore.getState().getPreloaded(track.id)
    useMusicStore.getState().setIsBuffering(true)

    if (preloaded && preloaded.readyState >= 3) {
      console.log(`⚡ Instant Play (Cache): ${track.name}`)
      this.audio.src = preloaded.src
    } else {
      console.log(`🔄 Streaming: ${track.name}`)
      this.audio.src = `${STREAM_BASE}/${track.id}`
    }

    this.audio.currentTime = 0
    this.audio.volume = useMusicStore.getState().volume

    // Media Session API (OS Controls)
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name.replace(/\.(mp3|wav|flac|m4a)$/i, ''),
        artist: 'Musique Library',
        album: 'Google Drive',
        artwork: [{ src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }]
      });
      navigator.mediaSession.setActionHandler('play', () => this.audio.play());
      navigator.mediaSession.setActionHandler('pause', () => this.audio.pause());
      navigator.mediaSession.setActionHandler('previoustrack', () => useMusicStore.getState().prevTrack());
      navigator.mediaSession.setActionHandler('nexttrack', () => useMusicStore.getState().nextTrack());
    }

    const playPromise = this.audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          useMusicStore.getState().setIsPlaying(true)
          useMusicStore.getState().setIsBuffering(false)
          setTimeout(() => this._preloadUpcoming(), 1000)
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          useMusicStore.getState().setIsPlaying(false)
          useMusicStore.getState().setIsBuffering(false)
          console.warn("Play failed:", err.message)
        })
    }
  }

  _preloadUpcoming() {
    const { queue, currentIndex, preloadedAudios } = useMusicStore.getState()
    
    Object.keys(preloadedAudios).forEach(id => {
      const isUpcoming = queue.slice(currentIndex + 1, currentIndex + PRELOAD_AHEAD + 1).some(t => t.id === id)
      if (!isUpcoming) {
        preloadedAudios[id].src = ''
        useMusicStore.getState().removePreloaded(id)
      }
    })

    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const next = queue[currentIndex + i]
      if (!next || preloadedAudios[next.id]) continue
      
      const a = new Audio()
      a.preload = 'auto'
      a.src = `${STREAM_BASE}/${next.id}`
      a.load()
      
      useMusicStore.getState().addPreloaded(next.id, a)
    }
  }

  seek(time) {
    this.audio.currentTime = time
    useMusicStore.getState().setCurrentTime(time)
  }

  playAtIndex(index) {
    const store = useMusicStore.getState()
    const track = store.queue[index]
    if (!track) return

    if (store.currentIndex === index) {
      if (!this.audio.src) this.loadAndPlay(track)
      else if (store.isPlaying) this.audio.pause()
      else this.audio.play().catch(console.error)
    } else {
      store.setCurrentIndex(index)
    }
  }

  // Search result se direct play karne ke liye
  playTrackById(trackId) {
    const store = useMusicStore.getState()
    let index = store.queue.findIndex(t => t.id === trackId)
    
    if (index !== -1) {
      this.playAtIndex(index)
    } else {
      const track = store.originalQueue.find(t => t.id === trackId)
      if (track) {
        useMusicStore.setState(state => ({
          queue: [...state.queue, track],
          currentIndex: state.queue.length,
          currentTime: 0
        }))
      }
    }
  }
}

const audioEngine = new AudioEngine()
export default audioEngine