import useMusicStore from '../store/musicStore'

const STREAM_BASE = '/api/stream'
const PRELOAD_AHEAD = 2

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
      const pct = this.audio.currentTime / this.audio.duration
      if (pct > 0.7) this._preloadUpcoming()
    })

    this.audio.addEventListener('loadedmetadata', () => {
      g().setDuration(this.audio.duration)
    })

    this.audio.addEventListener('waiting', () => g().setIsBuffering(true))
    this.audio.addEventListener('canplay', () => g().setIsBuffering(false))
    this.audio.addEventListener('playing', () => {
      g().setIsBuffering(false)
      g().setIsPlaying(true)
    })

    this.audio.addEventListener('ended', () => {
      const { loopMode, nextTrack } = useMusicStore.getState()
        
      if (loopMode === 'one') {
        this.audio.currentTime = 0
        this.audio.play().catch(console.error)
      } else {
        nextTrack()
      }
    })

    this.audio.addEventListener('pause', () => {
      if (!this.audio.ended) g().setIsPlaying(false)
    })

    // Watch currentIndex change
    let lastIndex = -1
    useMusicStore.subscribe((state) => {
      if (state.currentIndex !== lastIndex) {
        lastIndex = state.currentIndex
        const track = state.queue[state.currentIndex]
        if (track) this.loadAndPlay(track)
      }
    })

    // Watch volume
    useMusicStore.subscribe((state) => {
      this.audio.volume = state.volume
    })
  }

  loadAndPlay(track) {
    if (this._currentTrackId === track.id) {
      this.audio.play().catch(console.error)
      return
    }

    this._currentTrackId = track.id
    const preloaded = useMusicStore.getState().getPreloaded(track.id)

    useMusicStore.getState().setIsBuffering(true)

    if (preloaded && preloaded.readyState >= 3) {
      console.log(`⚡ Instant: ${track.name}`)
      this.audio.src = preloaded.src
    } else {
      console.log(`🔄 Streaming: ${track.name}`)
      this.audio.src = `${STREAM_BASE}/${track.id}`
    }

    this.audio.currentTime = 0
    this.audio.volume = useMusicStore.getState().volume
    this.audio.play()
      .then(() => {
        useMusicStore.getState().setIsPlaying(true)
        setTimeout(() => this._preloadUpcoming(), 2000)
      })
      .catch(console.error)
  }

  _preloadUpcoming() {
    const { queue, currentIndex, preloadedAudios } = useMusicStore.getState()
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const next = queue[currentIndex + i]
      if (!next || preloadedAudios[next.id]) continue
      const a = new Audio()
      a.preload = 'auto'
      a.src = `${STREAM_BASE}/${next.id}`
      useMusicStore.getState().addPreloaded(next.id, a)
      console.log(`📦 Preloading: ${next.name}`)
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
  
    const alreadyLoaded =
      store.currentIndex === index &&
      this._currentTrackId === track.id &&
      this.audio.src
  
    if (alreadyLoaded) {
      if (store.isPlaying) this.audio.pause()
      else this.audio.play().catch(console.error)
    } else if (store.currentIndex !== index) {
      store.setCurrentIndex(index)
    } else {
      this.loadAndPlay(track)
    }
  }
}

const audioEngine = new AudioEngine()
export default audioEngine