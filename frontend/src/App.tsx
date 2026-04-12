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
import DeepTalk from './pages/DeepTalk';
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
