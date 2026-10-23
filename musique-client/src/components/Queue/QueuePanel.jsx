import useMusicStore from '../../store/musicStore'
import audioEngine from '../../engine/AudioEngine'

export default function QueuePanel() {
  const { queue, currentIndex, isPlaying } = useMusicStore()

  const formatName = (name) => name.replace(/\.(mp3|wav|flac|m4a)$/i, '')

    // Agar koi gaana nahi chuna hai (-1), toh shuru se 15 gaane dikhao
  const startIdx = currentIndex >= 0 ? currentIndex : 0
  const upcoming = queue.slice(startIdx, startIdx + 15)

  const volume = useMusicStore((s) => s.volume)
  const setVolume = useMusicStore((s) => s.setVolume)
  

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <h3 className="text-white font-semibold text-sm">Up Next</h3>
        {/* <p className="text-gray-500 text-xs mt-0.5">{queue.length - currentIndex - 1} songs remaining</p> */}
      </div>

      <div className="overflow-y-auto flex-1">
        {upcoming.map((track, i) => {
          const actualIndex = currentIndex + i
          const isActive = i === 0

          return (
            <div
              key={track.id}
              onClick={() => audioEngine.playAtIndex(actualIndex)}
              className={`
                flex items-center gap-3 px-3 py-2.5 cursor-pointer
                border-b border-white/5 transition-colors
                ${isActive ? 'bg-purple-500/10' : 'hover:bg-white/5'}
              `}
            >
              {/* Thumbnail placeholder */}
              <div className={`
                w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-xs
                ${isActive ? 'bg-purple-500/30' : 'bg-white/10'}
              `}>
                {isActive && isPlaying
                  ? <span className="text-purple-400 animate-pulse">♫</span>
                  : <span className="text-gray-600">{actualIndex + 1}</span>
                }
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs truncate ${isActive ? 'text-purple-300 font-medium' : 'text-gray-300'}`}>
                  {formatName(track.name)}
                </p>
                {isActive && (
                  <p className="text-xs text-purple-400 mt-0.5">Now Playing</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Volume */}
      <div className="p-4 border-t border-white/10 shrink-0">
        <p className="text-xs text-gray-500 mb-2">Volume</p>
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs">🔈</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 accent-purple-500"
          />
          <span className="text-gray-600 text-xs">🔊</span>
        </div>
      </div>
    </div>
  )
}