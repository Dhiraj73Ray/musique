import { useEffect, useState } from 'react'
import Navbar from './components/Layout/Navbar'
import TrackList from './components/Library/TrackList'
import MainPlayer from './components/Player/MainPlayer'
import QueuePanel from './components/Queue/QueuePanel'
import useMusicStore from './store/musicStore'
import audioEngine from './engine/AudioEngine'

function App() {
  const { nextTrack, prevTrack, isPlaying } = useMusicStore()
  
  // Mobile Tab State ('library', 'player', 'queue')
  const [mobileTab, setMobileTab] = useState('player')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) audioEngine.audio.pause()
        else audioEngine.audio.play().catch(console.error)
      } else if (e.code === 'ArrowRight') nextTrack()
      else if (e.code === 'ArrowLeft') prevTrack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextTrack, prevTrack, isPlaying])

  return (
    <div className="h-screen bg-[#12121f] flex flex-col overflow-hidden text-white">
      <Navbar />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Left — Library (Mobile pe tab active hone par dikhega) */}
        <div className={`
          w-full md:w-72 border-r border-white/10 flex-col overflow-hidden shrink-0
          ${mobileTab === 'library' ? 'flex' : 'hidden'} md:flex
        `}>
          <TrackList />
        </div>

        {/* Center — Main Player */}
        <div className={`
          w-full md:flex-1 flex-col overflow-hidden
          ${mobileTab === 'player' ? 'flex' : 'hidden'} md:flex
        `}>
          <MainPlayer />
        </div>

        {/* Right — Queue */}
        <div className={`
          w-full md:w-64 border-l border-white/10 flex-col overflow-hidden shrink-0
          ${mobileTab === 'queue' ? 'flex' : 'hidden'} md:flex
        `}>
          <QueuePanel />
        </div>

      </div>

      {/* MOBILE BOTTOM NAVIGATION (Desktop pe hidden) */}
      <div className="md:hidden h-16 bg-[#1a1a2e] border-t border-white/10 flex items-center justify-around shrink-0 z-50">
        <button 
          onClick={() => setMobileTab('library')}
          className={`flex flex-col items-center gap-1 text-xs ${mobileTab === 'library' ? 'text-purple-400' : 'text-gray-500'}`}
        >
          <span className="text-xl">📚</span>
          Library
        </button>
        <button 
          onClick={() => setMobileTab('player')}
          className={`flex flex-col items-center gap-1 text-xs ${mobileTab === 'player' ? 'text-purple-400' : 'text-gray-500'}`}
        >
          <span className="text-xl">💿</span>
          Player
        </button>
        <button 
          onClick={() => setMobileTab('queue')}
          className={`flex flex-col items-center gap-1 text-xs ${mobileTab === 'queue' ? 'text-purple-400' : 'text-gray-500'}`}
        >
          <span className="text-xl">📋</span>
          Queue
        </button>
      </div>
    </div>
  )
}
export default App