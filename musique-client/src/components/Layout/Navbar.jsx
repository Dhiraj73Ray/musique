import useMusicStore from '../../store/musicStore'

export default function Navbar() {
  const { searchQuery, setSearchQuery, isBackendDown } = useMusicStore()

  // Escape key dabane pe search clear karne ke liye
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setSearchQuery('')
    }
  }

  return (
    <nav className="h-16 bg-[#1a1a2e] border-b border-white/10 flex items-center px-4 md:px-6 gap-4 md:gap-8 shrink-0">
      
      {/* Logo */}
      <div className="flex items-center gap-2">
        <span className="text-purple-400 text-2xl">𝄞</span>
        <span className="text-white font-bold text-lg tracking-wide hidden sm:block">Musique</span>
      </div>

      {/* YAHAN WAPAS ADD KIYE HAIN PLACEHOLDER LINKS */}
      <div className="hidden md:flex gap-6 text-sm text-gray-400">
        <button className="text-white border-b-2 border-purple-500 pb-1">My Library</button>
        <button className="hover:text-white transition">Playlists</button>
        <button className="hover:text-white transition">Favorites</button>
      </div>

      <div className="ml-auto flex items-center gap-3 md:gap-4">
        
        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-white/10 text-white text-sm pl-8 pr-8 py-2 rounded-full w-40 sm:w-64 outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 transition-all"
          />
          
          {/* Clear Search Button */}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 text-gray-300 flex items-center justify-center text-xs transition-colors"
              title="Clear search (Esc)"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dynamic Status Indicator (Mobile pe chhota dikhega) */}
        <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          isBackendDown ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-green-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${
            isBackendDown ? 'bg-red-400' : 'bg-green-400 animate-pulse'
          }`}></span>
          {isBackendDown ? 'Offline' : 'Connected'}
        </div>

        {/* User Profile */}
        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
          D
        </div>
      </div>
    </nav>
  )
}