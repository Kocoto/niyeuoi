import React, { useState, useEffect, useCallback } from 'react';
import { BellRing, Check, Loader2 } from 'lucide-react';
import { isPushSupported, getPushPermission, isPushSubscribed, subscribePush } from '../../utils/pushClient';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import type { Role } from '../../constants/roles';

/** Bật thông báo Web Push (cho web/PWA — nhất là iPhone bạn gái). Ẩn nếu không hỗ trợ. */
const PushEnableBanner: React.FC = () => {
  const { role } = useAuth();
  const { toast } = useUI();
  const [supported] = useState(isPushSupported());
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!isPushSupported()) return;
    setSubscribed(getPushPermission() === 'granted' && (await isPushSubscribed()));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!supported) {
    return (
      <p className="rounded-[1rem] bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-100">
        Thiết bị/trình duyệt này chưa bật được Web Push. iPhone: mở bằng PWA (Thêm vào Màn hình chính, iOS ≥16.4). App Android: nhận nhắc qua Discord.
      </p>
    );
  }

  if (subscribed) {
    return (
      <div className="flex items-center gap-1.5 self-start text-[11px] font-bold text-green-600">
        <Check size={13} /> Đã bật thông báo trên thiết bị này
      </div>
    );
  }

  const enable = async () => {
    setBusy(true);
    try {
      const ok = await subscribePush(role as Role);
      if (ok) { toast('Đã bật thông báo nhắc nhở.', 'success'); await refresh(); }
      else toast('Chưa bật được (kiểm tra quyền thông báo).', 'error');
    } finally { setBusy(false); }
  };

  return (
    <button
      type="button"
      onClick={enable}
      disabled={busy}
      className="flex items-center gap-2 self-start rounded-[1rem] bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100 disabled:opacity-60"
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />} Bật thông báo nhắc nhở trên máy này
    </button>
  );
};

export default PushEnableBanner;
