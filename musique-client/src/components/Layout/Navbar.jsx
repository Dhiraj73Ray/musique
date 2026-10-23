import useMusicStore from '../../store/musicStore'

export default function Navbar() {
  const { searchQuery, setSearchQuery, isBackendDown } = useMusicStore()

  return (
    <nav className="h-16 bg-[#1a1a2e] border-b border-white/10 flex items-center px-6 gap-8 shrink-0">
      <div className="flex items-center gap-2">
        <span className="text-purple-400 text-2xl">𝄞</span>
        <span className="text-white font-bold text-lg tracking-wide">Musique</span>
      </div>

      <div className="flex gap-6 text-sm text-gray-400">
        <button className="text-white border-b-2 border-purple-500 pb-1">My Library</button>
        <button className="hover:text-white transition">Playlists</button>
        <button className="hover:text-white transition">Favorites</button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by track, artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-white/10 text-white text-sm pl-8 pr-4 py-2 rounded-full w-64 outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500"
          />
        </div>

        {/* Dynamic Status Indicator */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isBackendDown ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-green-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isBackendDown ? 'bg-red-400' : 'bg-green-400 animate-pulse'
          }`}></span>
          {isBackendDown ? 'Server Offline' : 'Drive Connected'}
        </div>

        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
          D
        </div>
      </div>
    </nav>
  )
}