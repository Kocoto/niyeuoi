import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/NavbarV2';
import Home from './pages/HomeV2';
import Places from './pages/PlacesV2';
import Timeline from './pages/TimelineV2';
import Wishlist from './pages/WishlistV2';
import LoveMap from './pages/LoveMap';
import Coupons from './pages/CouponsV2';
import Events from './pages/EventsV2';
import MoodLofi from './pages/MoodV2';
import Challenges from './pages/Challenges';
import DeepTalk from './pages/DeepTalkV2';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ServerGate from './components/ServerGate';
import AuthGate from './components/AuthGate';

function App() {
  return (
    <UIProvider>
      <ServerGate>
        <AuthProvider>
          <AuthGate>
            <Router>
              <div className="app-shell">
                <Navbar />
                <main className="app-main">
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
                    <Route path="/deeptalk" element={<DeepTalk />} />
                    <Route path="*" element={<div className="surface-card mx-auto mt-20 max-w-xl px-8 py-12 text-center text-sm font-medium text-soft">Trang này đang được chuẩn bị để vừa hơn với không gian riêng của hai bạn.</div>} />
                  </Routes>
                </main>
              </div>
            </Router>
          </AuthGate>
        </AuthProvider>
      </ServerGate>
    </UIProvider>
  );
}

export default App;
