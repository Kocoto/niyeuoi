import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Chỉ đăng ký service worker (PWA) khi chạy trên web.
// Trong app native, Capacitor đã tự serve file tĩnh cục bộ nên SW dễ gây xung đột cache.
if (!Capacitor.isNativePlatform()) {
  registerSW({ immediate: true })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
