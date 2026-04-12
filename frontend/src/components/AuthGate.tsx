import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Heart, KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const roleCards = [
  {
    role: 'girlfriend' as const,
    title: 'Ni',
    subtitle: 'GF',
    description: 'Sign in so the app knows this session belongs to Ni.',
    accent: 'from-pink-200 via-rose-100 to-white',
    border: 'border-pink-200',
    button: 'bg-pink-500 hover:bg-pink-600',
  },
  {
    role: 'boyfriend' as const,
    title: 'Duoc',
    subtitle: 'BF',
    description: 'Sign in so boyfriend-only actions stay tied to Duoc.',
    accent: 'from-sky-200 via-cyan-100 to-white',
    border: 'border-sky-200',
    button: 'bg-sky-500 hover:bg-sky-600',
  },
];

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady, isAuthenticated, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'boyfriend' | 'girlfriend'>('girlfriend');
  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedCard = useMemo(
    () => roleCards.find(card => card.role === selectedRole) ?? roleCards[0],
    [selectedRole],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      const ok = await login(selectedRole, pin);
      if (ok) {
        setPin('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-rose-50">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-4 px-6 text-center"
        >
          <Heart className="fill-primary text-primary" size={44} />
          <div>
            <p className="text-lg font-bold text-gray-800">Checking active session</p>
            <p className="text-sm text-gray-500">Waiting a moment to identify the current user.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9998] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(251,207,232,0.45),_transparent_35%),linear-gradient(180deg,#fff8fb_0%,#fff_55%,#fdf2f8_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
        <div className="grid w-full gap-6 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_30px_80px_rgba(244,114,182,0.14)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-8">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-rose-100 via-white to-pink-50 p-6 md:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                <Heart className="fill-primary text-primary" size={24} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-400">Niyeuoi</p>
                <h1 className="text-3xl font-black text-gray-900">Who is using this app?</h1>
              </div>
            </div>

            <p className="max-w-lg text-sm leading-6 text-gray-600">
              The app now keeps a signed session so it knows whether the current user is <span className="font-bold text-pink-500">GF</span> or <span className="font-bold text-sky-500">BF</span>, instead of trusting a client-side role toggle.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {roleCards.map(card => {
                const active = card.role === selectedRole;
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setSelectedRole(card.role)}
                    className={`rounded-[1.5rem] border p-5 text-left transition-all ${active ? `${card.border} bg-gradient-to-br ${card.accent} shadow-lg` : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-black text-gray-900">{card.title}</p>
                        <p className="text-xs font-bold uppercase tracking-[0.28em] text-gray-400">{card.subtitle}</p>
                      </div>
                      {active && <ShieldCheck className="text-emerald-500" size={20} />}
                    </div>
                    <p className="mt-3 text-sm leading-6 text-gray-600">{card.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col justify-between rounded-[1.75rem] border border-gray-100 bg-white p-6 shadow-sm md:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Sign in</p>
              <h2 className="mt-2 text-2xl font-black text-gray-900">
                Continue as {selectedCard.title} <span className="text-gray-400">({selectedCard.subtitle})</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Enter the matching PIN so the whole session uses the correct role.
              </p>

              <label className="mt-8 block text-sm font-semibold text-gray-700">
                PIN
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-primary">
                  <KeyRound className="text-gray-400" size={18} />
                  <input
                    type="password"
                    value={pin}
                    onChange={event => setPin(event.target.value)}
                    placeholder="****"
                    className="w-full bg-transparent text-base font-bold tracking-[0.35em] text-gray-800 outline-none placeholder:text-gray-300"
                  />
                </div>
              </label>
            </div>

            <div className="mt-8">
              <button
                type="submit"
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-70 ${selectedCard.button}`}
              >
                <LogIn size={16} />
                {submitting ? 'Authenticating...' : `Sign in as ${selectedCard.subtitle}`}
              </button>
              <AnimatePresence mode="wait">
                <motion.p
                  key={selectedRole}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-4 text-center text-xs leading-5 text-gray-400"
                >
                  For separate protection, set both <code>GIRLFRIEND_PIN</code> and <code>BOYFRIEND_PIN</code> in backend env.
                </motion.p>
              </AnimatePresence>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
