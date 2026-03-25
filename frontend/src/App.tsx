import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Places from './pages/Places';
import Timeline from './pages/Timeline';
import Wishlist from './pages/Wishlist';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-gray-800">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/places" element={<Places />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="*" element={<div className="text-center mt-20 font-medium text-gray-400">Trang này đang được lén chuẩn bị... 💕</div>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
