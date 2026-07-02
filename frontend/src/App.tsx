import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import Navbar from './components/Navbar';
import { initNativeApp, hasPendingShareText } from './utils/nativeApp';
import { syncLocalReminders } from './utils/localReminders';
import reminderApi from './api/reminderApi';
import { useAuth } from './context/AuthContext';
import type { Role } from './constants/roles';
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
import Letters from './pages/Letters';
import Expenses from './pages/Expenses';
import ExpenseTransactions from './pages/ExpenseTransactions';
import ExpenseSavings from './pages/ExpenseSavings';
import ExpenseRecurring from './pages/ExpenseRecurring';
import ExpenseDebts from './pages/ExpenseDebts';
import Calories from './pages/Calories';
import Reminders from './pages/Reminders';
import { AuthProvider } from './context/AuthContext';
import { UIProvider } from './context/UIContext';
import ServerGate from './components/ServerGate';
import AuthGate from './components/AuthGate';

/**
 * Điều hướng sang /expenses khi có nội dung được share vào app (Android share).
 * Đặt trong <Router> để dùng client-side navigation (BrowserRouter không cho
 * điều hướng cứng tới /expenses trong Capacitor). Expenses.tsx sẽ tự đọc
 * sessionStorage và mở NotificationImportSheet.
 */
function ShareNavigator() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const goExpenses = () => {
      if (location.pathname !== '/expenses') navigate('/expenses');
      // Nếu đã ở /expenses: listener trong Expenses tự xử lý event.
    };
    // Cold start: đã có pending text trước khi Router mount → đi luôn.
    if (hasPendingShareText()) goExpenses();
    window.addEventListener('niyeuoi-share-ready', goExpenses);
    return () => window.removeEventListener('niyeuoi-share-ready', goExpenses);
  }, [navigate, location.pathname]);

  return null;
}

/**
 * Đồng bộ nhắc nhở → local notification trên máy native (lúc mở app + mỗi lần resume).
 * No-op trên web. Nhờ vậy lịch báo thức được đặt kể cả khi không mở trang Nhắc nhở.
 */
function ReminderSync() {
  const { role } = useAuth();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await reminderApi.getReminders();
        if (!cancelled) await syncLocalReminders(res.data.data ?? [], role as Role);
      } catch { /* ignore */ }
    };
    run();
    const handle = CapApp.addListener('resume', run);
    return () => { cancelled = true; handle.then((h) => h.remove()).catch(() => {}); };
  }, [role]);
  return null;
}

function App() {
  useEffect(() => {
    const cleanup = initNativeApp();
    return cleanup;
  }, []);

  return (
    <UIProvider>
      <ServerGate>
        <AuthProvider>
          <AuthGate>
            <Router>
              <ShareNavigator />
              <ReminderSync />
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
                    <Route path="/letters" element={<Letters />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/expenses/transactions" element={<ExpenseTransactions />} />
                    <Route path="/expenses/savings" element={<ExpenseSavings />} />
                    <Route path="/expenses/recurring" element={<ExpenseRecurring />} />
                    <Route path="/expenses/debts" element={<ExpenseDebts />} />
                    <Route path="/calories" element={<Calories />} />
                    <Route path="/reminders" element={<Reminders />} />
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
