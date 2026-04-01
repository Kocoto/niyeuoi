import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Places from './pages/Places';
import Timeline from './pages/Timeline';
import Wishlist from './pages/Wishlist';
import LoveMap from './pages/LoveMap';
import Coupons from './pages/Coupons';
import Events from './pages/Events';
import MoodLofi from './pages/MoodLofi';
import Challenges from './pages/Challenges';

import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ServerGate from './components/ServerGate';

function App() {
  return (
    <UIProvider>
    <ServerGate>
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-background text-gray-800">
          <Navbar />
          <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/places" element={<Places />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/map" element={<LoveMap />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/events" element={<Events />} />
              <Route path="/mood" element={<MoodLofi />} />
              <Route path="/challenges" element={<Challenges />} />
              <Route path="*" element={<div className="text-center mt-20 font-medium text-gray-400">Trang này đang được lén chuẩn bị... 💕</div>} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
    </ServerGate>
    </UIProvider>
  );
}

export default App;
