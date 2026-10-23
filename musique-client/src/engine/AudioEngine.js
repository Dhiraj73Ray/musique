import useMusicStore from '../store/musicStore'

const STREAM_BASE = '/api/stream'
const PRELOAD_AHEAD = 3 // Next 3 gaane preload honge

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
      // Agar gaana 60% play ho chuka hai, toh aage ke gaane preload karo
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
    })

    this.audio.addEventListener('ended', () => {
      const { loopMode, nextTrack } = g()
      
      // Check karo ki gaana actually khatam hua hai ya error ki wajah se ruka hai
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

    // Watch currentIndex change
        // Watch currentIndex change
    let lastIndex = -1
    useMusicStore.subscribe((state) => {
      if (state.currentIndex !== lastIndex) {
        lastIndex = state.currentIndex
        const track = state.queue[state.currentIndex]
        
        if (track) {
          // Agar pehli baar load ho raha hai (-1 se change hua hai)
          if (this._currentTrackId === null) {
            this._currentTrackId = track.id; // Bas ID set karo, play mat karo
          } else {
            // Agar user ne manually click kiya
            this.loadAndPlay(track)
          }
        }
      }
    })

    // Watch volume
    useMusicStore.subscribe((state) => {
      this.audio.volume = state.volume
    })
  }

    loadAndPlay(track) {
    // YEH CHECK UPDATE KARO: src empty na ho tabhi skip karo
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
    
        // OS Media Controls Setup
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.name.replace(/\.(mp3|wav|flac|m4a)$/i, ''),
        artist: 'Musique Library',
        album: 'Google Drive',
        artwork: [
          { src: 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png', sizes: '512x512', type: 'image/png' }
        ]
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
    
    // Memory Leak Fix: Jo gaane ab preload nahi chahiye, unhe memory se hatao
    Object.keys(preloadedAudios).forEach(id => {
      const isUpcoming = queue.slice(currentIndex + 1, currentIndex + PRELOAD_AHEAD + 1).some(t => t.id === id)
      if (!isUpcoming) {
        preloadedAudios[id].src = '' // Browser memory free karo
        useMusicStore.getState().removePreloaded(id)
      }
    })

    // Next 3 gaane background mein download karo
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const next = queue[currentIndex + i]
      if (!next || preloadedAudios[next.id]) continue
      
      const a = new Audio()
      a.preload = 'auto'
      a.src = `${STREAM_BASE}/${next.id}`
      a.load() // YEH LINE ACTUAL DOWNLOAD TRIGGER KARTI HAI
      
      useMusicStore.getState().addPreloaded(next.id, a)
      console.log(`📦 Preloading in background: ${next.name}`)
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
      // AGAR SRC EMPTY HAI (First Load), TOH LOAD KARO
      if (!this.audio.src) {
        this.loadAndPlay(track)
      } 
      // Agar src hai, toh normal toggle karo
      else if (store.isPlaying) {
        this.audio.pause()
      } else {
        this.audio.play().catch(console.error)
      }
    } else {
      // Alag gaana select kiya gaya hai
      store.setCurrentIndex(index)
    }
  }

    playTrackById(trackId) {
    const store = useMusicStore.getState()
    
    // 1. Check karo ki gaana already current queue mein hai ya nahi
    let index = store.queue.findIndex(t => t.id === trackId)
    
    if (index !== -1) {
      // Agar queue mein hai, toh seedha play karo
      this.playAtIndex(index)
    } else {
      // 2. Agar queue mein nahi hai (matlab search se kisi naye gaane pe click kiya)
      const track = store.originalQueue.find(t => t.id === trackId)
      if (track) {
        // Us gaane ko current queue ke end mein add karo aur play karo
        useMusicStore.setState(state => ({
          queue: [...state.queue, track],
          currentIndex: state.queue.length, // Naya index end mein
          currentTime: 0
        }))
      }
    }
  }
  
}

const audioEngine = new AudioEngine()
export default audioEngine