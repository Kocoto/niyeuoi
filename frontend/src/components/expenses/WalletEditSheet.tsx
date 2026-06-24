import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, X } from 'lucide-react';
import AmountInput from './AmountInput';
import expenseApi, { type IWallet } from '../../api/expenseApi';
import { useUI } from '../../context/UIContext';

interface WalletEditSheetProps {
  wallet: IWallet;
  onClose: () => void;
  onSaved: () => void;
}

const COLORS = ['rose', 'pink', 'blue', 'teal', 'amber'];
const COLOR_DOT: Record<string, string> = {
  rose: 'bg-rose-400', pink: 'bg-pink-400', blue: 'bg-sky-400', teal: 'bg-teal-400', amber: 'bg-amber-400',
};

const WalletEditSheet: React.FC<WalletEditSheetProps> = ({ wallet, onClose, onSaved }) => {
  const { toast } = useUI();
  const [name, setName] = useState(wallet.name);
  const [color, setColor] = useState(wallet.color);
  const [balance, setBalance] = useState(wallet.balance);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('Nhập tên ví nhé.', 'error');
    setSubmitting(true);
    try {
      // Tên/màu chỉ sửa được với ví tự tạo; số dư thì ví nào cũng đặt được
      if (!wallet.isDefault && (name.trim() !== wallet.name || color !== wallet.color)) {
        await expenseApi.updateWallet(wallet._id, { name: name.trim(), color });
      }
      if (balance !== wallet.balance) {
        await expenseApi.setWalletBalance(wallet._id, balance);
      }
      toast('Đã cập nhật ví.', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa cập nhật được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="sheet-shell">
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
        <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Sửa ví</h2>
            <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="section-label">Tên ví</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={wallet.isDefault}
                className="form-input disabled:opacity-60"
              />
              {wallet.isDefault && <p className="text-[11px] text-soft/70">Ví mặc định không đổi được tên.</p>}
            </div>

            {!wallet.isDefault && (
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Màu</label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-8 w-8 rounded-full ${COLOR_DOT[c]} ring-2 transition ${color === c ? 'ring-ink/40' : 'ring-transparent'}`}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="section-label">Số dư hiện tại</label>
              <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-4">
                <AmountInput value={balance} onChange={setBalance} />
              </div>
              <p className="text-[11px] text-soft/70">Nhập số tiền thật đang có trong ví này.</p>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletEditSheet;
