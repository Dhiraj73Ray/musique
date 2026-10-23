import Navbar from './components/Layout/Navbar'
import TrackList from './components/Library/TrackList'
import MainPlayer from './components/Player/MainPlayer'
import QueuePanel from './components/Queue/QueuePanel'

function App() {
  return (
    <div className="h-screen bg-[#12121f] flex flex-col overflow-hidden text-white">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">

        {/* Left — Library */}
        <div className="w-72 border-r border-white/10 flex flex-col overflow-hidden shrink-0">
          <TrackList />
        </div>

        {/* Center — Main Player */}
        <MainPlayer />

        {/* Right — Queue */}
        <div className="w-64 border-l border-white/10 flex flex-col overflow-hidden shrink-0">
          <QueuePanel />
        </div>

      </div>
    </div>
  )
}

export default App