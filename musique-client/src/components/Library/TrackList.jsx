import { useEffect } from 'react'
import useMusicStore from '../../store/musicStore'
import audioEngine from '../../engine/AudioEngine'
import { getCachedTracks, cacheTracks, fetchAllTracks, clearCache } from '../../services/trackService'

export default function TrackList() {
  const {
    queue, currentIndex, isPlaying,
    searchQuery, displayCount, loadMore,
    totalTracks, isLoadingTracks, isSyncing,
    setTracks, setIsLoadingTracks, setIsSyncing, setLastSynced
  } = useMusicStore()

  useEffect(() => {
    loadTracks()
  }, [])

  const loadTracks = async () => {
    // Step 1: Cache check — instant load
    const cached = getCachedTracks()
    if (cached && cached.length > 0) {
      setTracks(cached)
      // Background mein quietly sync karo
      syncInBackground()
      return
    }
    // Step 2: No cache — Drive se fetch karo
    setIsLoadingTracks(true)
    try {
      const tracks = await fetchAllTracks()
      setTracks(tracks)
      cacheTracks(tracks)
      setLastSynced(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingTracks(false)
    }
  }

  const syncInBackground = async () => {
    try {
      const tracks = await fetchAllTracks()
      setTracks(tracks)
      cacheTracks(tracks)
      setLastSynced(new Date())
    } catch (e) {
      console.error('Background sync failed:', e)
    }
  }

  const handleManualSync = async () => {
    setIsSyncing(true)
    clearCache()
    try {
      const tracks = await fetchAllTracks()
      setTracks(tracks)
      cacheTracks(tracks)
      setLastSynced(new Date())
    } catch (e) {
      console.error(e)
    } finally {
      setIsSyncing(false)
    }
  }

  const filtered = searchQuery
    ? queue.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : queue

  const formatName = (name) => name.replace(/\.(mp3|wav|flac|m4a)$/i, '')

  if (isLoadingTracks) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-3 text-gray-500">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm">Loading your library...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-white font-semibold">My Library</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            {displayCount} songs
          </p>
        </div>
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="text-xs text-purple-400 hover:text-purple-300 transition flex items-center gap-1 disabled:opacity-50"
        >
          <span className={isSyncing ? 'animate-spin inline-block' : ''}>↻</span>
          {isSyncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      {/* List */}
      <div className="overflow-y-auto flex-1">
        {filtered.map((track) => {
          const isActive = queue[currentIndex]?.id === track.id
          const actualIndex = queue.findIndex(t => t.id === track.id)

          return (
            <div
              key={track.id}
              onClick={() => audioEngine.playAtIndex(actualIndex)}
              className={`
                flex items-center gap-3 px-4 py-2.5 cursor-pointer
                border-b border-white/5 transition-colors
                ${isActive ? 'bg-purple-500/20 border-l-2 border-l-purple-500' : 'hover:bg-white/5'}
              `}
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 text-sm">
                {isActive && isPlaying ? (
                  <span className="text-purple-400 animate-pulse">♫</span>
                ) : (
                  <span className="text-gray-600">♪</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${isActive ? 'text-purple-300 font-medium' : 'text-white'}`}>
                  {formatName(track.name)}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">
                  {isActive ? (isPlaying ? '▶ Playing' : '⏸ Paused') : ''}
                </p>
              </div>
              <span className="text-xs text-gray-700 shrink-0">
                {track.size ? `${(track.size / 1024 / 1024).toFixed(1)}MB` : ''}
              </span>
            </div>
          )
        })}

        {/* Load More */}
        {!searchQuery && displayCount < totalTracks && (
          <button
            onClick={loadMore}
            className="w-full py-3 text-sm text-purple-400 hover:text-purple-300 hover:bg-white/5 transition border-t border-white/10"
          >
            {/* Load More ({totalTracks - displayCount} remaining) */}
            Load More..
          </button>
        )}
        <div className="h-4" />
      </div>
    </div>
  )
}