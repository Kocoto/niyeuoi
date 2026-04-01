import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info, AlertTriangle, X, Heart } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmState {
  open: boolean;
  message: string;
  resolve: ((value: boolean) => void) | null;
}

interface PromptState {
  open: boolean;
  message: string;
  placeholder: string;
  inputType: string;
  resolve: ((value: string | null) => void) | null;
}

interface UIContextValue {
  toast: (message: string, type?: ToastType) => void;
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, placeholder?: string, inputType?: string) => Promise<string | null>;
}

const UIContext = createContext<UIContextValue | null>(null);

const toastConfig: Record<ToastType, { icon: React.ReactNode; border: string; iconColor: string }> = {
  success: { icon: <CheckCircle2 size={18} />, border: 'border-l-4 border-l-pink-400', iconColor: 'text-pink-500' },
  error:   { icon: <XCircle size={18} />,     border: 'border-l-4 border-l-red-400',   iconColor: 'text-red-500'  },
  info:    { icon: <Info size={18} />,         border: 'border-l-4 border-l-violet-400',iconColor: 'text-violet-500'},
  warning: { icon: <AlertTriangle size={18} />,border: 'border-l-4 border-l-amber-400', iconColor: 'text-amber-500'},
};

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, message: '', resolve: null });
  const [promptState, setPromptState] = useState<PromptState>({ open: false, message: '', placeholder: '', inputType: 'text', resolve: null });
  const [promptValue, setPromptValue] = useState('');
  const toastId = useRef(0);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId.current;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmState({ open: true, message, resolve });
    });
  }, []);

  const prompt = useCallback((message: string, placeholder = '', inputType = 'text'): Promise<string | null> => {
    setPromptValue('');
    return new Promise(resolve => {
      setPromptState({ open: true, message, placeholder, inputType, resolve });
    });
  }, []);

  const handleConfirm = (value: boolean) => {
    confirmState.resolve?.(value);
    setConfirmState({ open: false, message: '', resolve: null });
  };

  const handlePrompt = (value: string | null) => {
    promptState.resolve?.(value);
    setPromptState({ open: false, message: '', placeholder: '', inputType: 'text', resolve: null });
    setPromptValue('');
  };

  return (
    <UIContext.Provider value={{ toast, confirm, prompt }}>
      {children}

      {/* ── Toast Container ── */}
      <div className="fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence mode="sync">
          {toasts.map(t => {
            const cfg = toastConfig[t.type];
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 16, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className={`pointer-events-auto w-full flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg bg-white ${cfg.border}`}
              >
                <span className={cfg.iconColor}>{cfg.icon}</span>
                <span className="text-sm text-gray-700 font-medium flex-1">{t.message}</span>
                <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-gray-300 hover:text-gray-500 transition-colors">
                  <X size={14} />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* ── Confirm Dialog ── */}
      <AnimatePresence>
        {confirmState.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handleConfirm(false)} />
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl text-center"
            >
              <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-pink-400" size={26} fill="currentColor" />
              </div>
              <p className="text-gray-700 font-semibold text-base mb-6 leading-relaxed">{confirmState.message}</p>
              <div className="flex gap-3">
                <button onClick={() => handleConfirm(false)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-all">Thôi</button>
                <button onClick={() => handleConfirm(true)} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-pink-100 hover:opacity-90 transition-all">Đồng ý ❤️</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Prompt Dialog ── */}
      <AnimatePresence>
        {promptState.open && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => handlePrompt(null)} />
            <motion.div
              initial={{ scale: 0.85, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="relative bg-white w-full max-w-xs rounded-[2rem] p-8 shadow-2xl"
            >
              <div className="w-14 h-14 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-pink-400" size={26} fill="currentColor" />
              </div>
              <p className="text-gray-700 font-semibold text-base mb-4 text-center leading-relaxed">{promptState.message}</p>
              <input
                autoFocus
                type={promptState.inputType}
                placeholder={promptState.placeholder}
                value={promptValue}
                onChange={e => setPromptValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handlePrompt(promptValue || null); if (e.key === 'Escape') handlePrompt(null); }}
                className="w-full bg-gray-50 border-2 border-transparent focus:border-primary rounded-2xl px-4 py-3 text-sm outline-none mb-4 transition-all text-center tracking-widest font-bold"
              />
              <div className="flex gap-3">
                <button onClick={() => handlePrompt(null)} className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold text-sm hover:bg-gray-200 transition-all">Hủy</button>
                <button onClick={() => handlePrompt(promptValue || null)} className="flex-1 py-3 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg shadow-pink-100 hover:opacity-90 transition-all">Xác nhận</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within UIProvider');
  return ctx;
};
