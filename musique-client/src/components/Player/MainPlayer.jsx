import { useRef, useState } from 'react'
import useMusicStore from '../../store/musicStore'
import audioEngine from '../../engine/AudioEngine'

export default function MainPlayer() {
  const {
    queue, currentIndex, isPlaying, isBuffering,
    currentTime, duration, loopMode, isShuffled, networkError,
    toggleShuffle, toggleLoop, nextTrack, prevTrack
  } = useMusicStore()

  const [isDragging, setIsDragging] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)

  const seekRef = useRef(null)
  const track = queue[currentIndex]

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handlePointerDown = (e) => {
    setIsDragging(true)
    updatePreviewTime(e)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (isDragging) updatePreviewTime(e)
  }

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false)
      e.currentTarget.releasePointerCapture(e.pointerId)
      audioEngine.seek(previewTime) 
    }
  }

  const updatePreviewTime = (e) => {
    if (!seekRef.current || !duration) return
    const rect = seekRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setPreviewTime(ratio * duration)
  }

  const displayTime = isDragging ? previewTime : currentTime
  const progress = duration ? (displayTime / duration) * 100 : 0

  // No song selected state (Fresh load)
  if (!track || currentIndex === -1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-600">
        <div className="w-52 h-52 rounded-full bg-white/5 flex items-center justify-center">
          <span className="text-7xl opacity-20">🎵</span>
        </div>
        <p className="text-base">Select a song to play</p>
      </div>
    )
  }

  const trackName = track.name.replace(/\.(mp3|wav|flac|m4a)$/i, '')

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 px-8 bg-gradient-to-b from-purple-900/10 to-transparent">
      <div 
        className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center shadow-2xl shadow-purple-900/60 animate-spin [animation-duration:8s]"
        style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
      >
        <div className="w-16 h-16 rounded-full bg-[#12121f] flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-purple-400/60" />
        </div>
        {isBuffering && (
          <div className="absolute inset-0 rounded-full border-4 border-white/20 border-t-white animate-spin" />
        )}
      </div>

      <div className="text-center max-w-sm">
        <h2 className="text-white text-lg md:text-xl font-bold truncate">{trackName}</h2>
        <p className="text-gray-500 text-sm mt-1">
          {networkError ? <span className="text-red-400">{networkError}</span> : 
           isBuffering ? '⏳ Buffering...' : 'Google Drive • Streaming'}
        </p>
      </div>

      <div className="w-full max-w-md">
        <div
          ref={seekRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="h-1.5 bg-white/10 rounded-full cursor-pointer group relative touch-none"
        >
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative"
            style={{ width: `${progress}%` }}
          >
            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg transition-opacity ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-100'}`} />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-1.5">
          <span>{formatTime(displayTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center gap-8">
        <button
          onClick={toggleShuffle}
          className={`text-xl transition-colors ${isShuffled ? 'text-purple-400' : 'text-gray-600 hover:text-gray-300'}`}
        >
          {isShuffled ? '🔀' : '⇄'}
        </button>

        <button
          onClick={() => {
            if (currentTime > 3) audioEngine.seek(0)
            else prevTrack()
          }}
          className="text-gray-300 hover:text-white text-2xl transition-colors"
        >
          ⏮
        </button>

        <button
          onClick={() => audioEngine.playAtIndex(currentIndex)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          {isBuffering ? (
            <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? '⏸' : '▶'}
        </button>

        <button
          onClick={nextTrack}
          className="text-gray-300 hover:text-white text-2xl transition-colors"
        >
          ⏭
        </button>

        <button
          onClick={toggleLoop}
          className={`text-xl transition-colors ${loopMode !== 'none' ? 'text-purple-400' : 'text-gray-600 hover:text-gray-300'}`}
        >
          {loopMode === 'one' ? '🔂' : '🔁'}
        </button>
      </div>
    </div>
  )
}