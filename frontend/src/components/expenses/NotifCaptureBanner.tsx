import React, { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { BellRing, ChevronRight, Check } from 'lucide-react';
import { isNotifCaptureEnabled, openNotifSettings } from '../../utils/nativeApp';

/**
 * Chỉ hiện trên app native Android. Nếu chưa cấp Notification access → nút mở
 * màn cài đặt để bật tự đọc thông báo ngân hàng. Đã cấp → hiện trạng thái.
 */
const NotifCaptureBanner: React.FC = () => {
  const [show, setShow] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const check = useCallback(async () => {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      setShow(false);
      return;
    }
    setShow(true);
    setEnabled(await isNotifCaptureEnabled());
  }, []);

  useEffect(() => {
    check();
    // Người dùng bật quyền ở màn Cài đặt rồi quay lại → re-check.
    const onVis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [check]);

  if (!show) return null;

  if (enabled) {
    return (
      <div className="flex items-center gap-1.5 self-start text-[11px] font-bold text-green-600">
        <Check size={13} /> Đang tự đọc thông báo ngân hàng
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={openNotifSettings}
      className="flex items-center gap-2 self-start rounded-[1rem] bg-sky-50 px-3 py-2 text-xs font-bold text-sky-700 ring-1 ring-sky-100 transition hover:bg-sky-100"
    >
      <BellRing size={14} /> Bật tự đọc thông báo ngân hàng
      <ChevronRight size={13} />
    </button>
  );
};

export default NotifCaptureBanner;
