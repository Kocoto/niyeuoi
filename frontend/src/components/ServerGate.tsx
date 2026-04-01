import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import api from '../api/api';

type Status = 'checking' | 'starting' | 'ready';

const POLL_INTERVAL = 2000;

const messages = [
  'Đang đánh thức server dậy...',
  'Server đang ngủ, chờ tí nhé 🥱',
  'Sắp xong rồi, kiên nhẫn nha 💕',
  'Còn một chút nữa thôi...',
  'Gần xong rồi ❤️',
];

const ServerGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<Status>('checking');
  const [msgIndex, setMsgIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let msgTimer: ReturnType<typeof setInterval>;
    let elapsedTimer: ReturnType<typeof setInterval>;

    const check = async () => {
      try {
        // Bất kỳ HTTP response nào (kể cả lỗi 4xx) đều nghĩa là server đang chạy
        await api.get('/health', { timeout: 5000 });
        setStatus('ready');
        return;
      } catch (err: any) {
        if (err.response) {
          // Có response → server đang chạy, chỉ là endpoint chưa có
          setStatus('ready');
          return;
        }
        // Network error / timeout → server chưa sẵn sàng
        setStatus('starting');
      }
      timer = setTimeout(check, POLL_INTERVAL);
    };

    check();

    msgTimer = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length);
    }, 3000);

    elapsedTimer = setInterval(() => {
      setElapsed(s => s + 1);
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(msgTimer);
      clearInterval(elapsedTimer);
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {status !== 'ready' && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center gap-6 px-8"
          >
            {/* Logo */}
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Heart className="text-primary fill-primary" size={52} />
            </motion.div>

            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-800 mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>
                Niyeuoi
              </h1>
              <p className="text-sm text-gray-400 italic">nhật ký tình yêu của chúng mình</p>
            </div>

            {/* Loading dots */}
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <motion.span
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                />
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="text-sm text-gray-500 font-medium text-center"
              >
                {status === 'checking' ? 'Đang kiểm tra kết nối...' : messages[msgIndex]}
              </motion.p>
            </AnimatePresence>

            {elapsed >= 5 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-300"
              >
                {elapsed}s
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {status === 'ready' && children}
    </>
  );
};

export default ServerGate;
