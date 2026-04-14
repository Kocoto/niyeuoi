import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, KeyRound, LogIn, ShieldCheck } from 'lucide-react';
import PersonBadge from './PersonBadge';
import { useAuth } from '../context/AuthContext';
import { ROLE_AUTH_LABEL, ROLE_META, ROLE_NAME, type Role } from '../constants/roles';

const roleCards = [
  {
    role: 'girlfriend' as const,
    description: `Dang nhap de app biet phien nay la cua ${ROLE_NAME.girlfriend}.`,
  },
  {
    role: 'boyfriend' as const,
    description: `Dang nhap de cac thao tac cua ${ROLE_NAME.boyfriend} duoc gan dung nguoi dung.`,
  },
];

const AuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isReady, isAuthenticated, login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>('girlfriend');
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
      if (ok) setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-rose-50 px-6">
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-4 text-center"
        >
          <Heart className="fill-primary text-primary" size={44} />
          <div>
            <p className="text-lg font-bold text-gray-800">Dang kiem tra phien dang nhap</p>
            <p className="text-sm text-gray-500">Cho mot chut de xac dinh nguoi dang dung app.</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[9998] overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(251,207,232,0.45),_transparent_35%),linear-gradient(180deg,#fff8fb_0%,#fff_55%,#fdf2f8_100%)] px-4 pb-safe pt-safe">
      <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center py-4 sm:py-8">
        <div className="grid w-full gap-4 rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-[0_30px_80px_rgba(244,114,182,0.14)] backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:gap-6 md:rounded-[2rem] md:p-8">
          <div className="rounded-[1.5rem] bg-gradient-to-br from-rose-100 via-white to-pink-50 p-5 md:rounded-[1.75rem] md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm md:h-12 md:w-12">
                <Heart className="fill-primary text-primary" size={22} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-pink-400">Niyeuoi</p>
                <h1 className="text-2xl font-black text-gray-900 md:text-3xl">Ai dang dung app nay?</h1>
              </div>
            </div>

            <p className="max-w-lg text-sm leading-6 text-gray-600">
              App se luu phien dang nhap de biet hien tai dang la {ROLE_NAME.girlfriend} hay {ROLE_NAME.boyfriend}, thay vi chi doi role o phia client.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 md:mt-6 md:gap-4">
              {roleCards.map(card => {
                const active = card.role === selectedRole;
                const meta = ROLE_META[card.role];
                return (
                  <button
                    key={card.role}
                    type="button"
                    onClick={() => setSelectedRole(card.role)}
                    className={`rounded-[1.35rem] border p-4 text-left ${active ? `${meta.authBorderClassName} bg-gradient-to-br ${meta.authGradientClassName} shadow-lg` : 'border-gray-200 bg-white hover:border-gray-300'} transition-colors shadow-sm`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <PersonBadge role={card.role} variant={active ? 'solid' : 'soft'} />
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.28em] text-gray-400">{ROLE_AUTH_LABEL[card.role]}</p>
                      </div>
                      {active && <ShieldCheck className="text-emerald-500" size={20} />}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{card.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col justify-between rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm md:rounded-[1.75rem] md:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-gray-400">Dang nhap</p>
              <h2 className="mt-2 text-xl font-black text-gray-900 md:text-2xl">
                Vao voi vai tro {ROLE_NAME[selectedCard.role]} <span className="text-gray-400">({ROLE_AUTH_LABEL[selectedCard.role]})</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                Nhap dung PIN de ca phien hien tai dung dung role.
              </p>

              <label className="mt-7 block text-sm font-semibold text-gray-700">
                Ma PIN
                <div className="mt-2 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 focus-within:border-primary transition-colors">
                  <KeyRound className="text-gray-400" size={18} aria-hidden="true" />
                  <input
                    type="password"
                    name="pin"
                    inputMode="numeric"
                    autoComplete="current-password"
                    aria-label="Ma PIN"
                    value={pin}
                    onChange={event => setPin(event.target.value)}
                    placeholder="****"
                    className="w-full bg-transparent text-base font-bold tracking-[0.35em] text-gray-800 outline-none placeholder:text-gray-300"
                  />
                </div>
              </label>
            </div>

            <div className="mt-7">
              <button
                type="submit"
                disabled={submitting}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-70 ${ROLE_META[selectedCard.role].authButtonClassName}`}
              >
                <LogIn size={16} aria-hidden="true" />
                {submitting ? 'Dang xac thuc...' : `Dang nhap voi ${ROLE_AUTH_LABEL[selectedCard.role]}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthGate;
