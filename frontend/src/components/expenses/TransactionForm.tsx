import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import AmountInput from './AmountInput';
import CategoryChip from './CategoryChip';
import type { IWallet, IExpenseCategory } from '../../api/expenseApi';
import expenseApi from '../../api/expenseApi';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { ROLE_NAME } from '../../constants/roles';
import type { Role } from '../../constants/roles';

interface TransactionFormProps {
  wallets: IWallet[];
  categories: IExpenseCategory[];
  onClose: () => void;
  onSaved: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
}

type TxType = 'income' | 'expense' | 'transfer';

const TransactionForm: React.FC<TransactionFormProps> = ({ wallets, categories, onClose, onSaved, defaultType = 'expense' }) => {
  const { role } = useAuth();
  const { toast } = useUI();

  const [type, setType] = useState<TxType>(defaultType);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?._id ?? '');
  const [toWalletId, setToWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isSplit, setIsSplit] = useState(false);
  const [splitMethod, setSplitMethod] = useState<'half' | 'custom'>('half');
  const [splitBf, setSplitBf] = useState(0);
  const [splitGf, setSplitGf] = useState(0);
  const [paidBy, setPaidBy] = useState<Role>(role as Role);
  const [submitting, setSubmitting] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const res = await expenseApi.scanReceipt(file);
      const d = res.data.data;
      if (d.amount) setAmount(d.amount);
      if (d.note) setNote(d.note);
      if (d.date) setDate(d.date.slice(0, 10));
      if (d.type) setType(d.type);
      toast('Đã đọc biên lai — kiểm tra lại trước khi lưu nhé.', 'success');
    } catch {
      toast('Không đọc được ảnh, nhập tay nha.', 'error');
    } finally {
      setScanning(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleHalfSplit = (val: number) => {
    const half = Math.round(val / 2);
    setSplitBf(half);
    setSplitGf(val - half);
  };

  const handleAmountChange = (val: number) => {
    setAmount(val);
    if (isSplit && splitMethod === 'half') handleHalfSplit(val);
  };

  const handleSplitToggle = (on: boolean) => {
    setIsSplit(on);
    if (on) handleHalfSplit(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast('Nhập số tiền trước nhé.', 'error');
    if (!walletId) return toast('Chọn ví đi nào.', 'error');
    if (type === 'expense' && !categoryId) return toast('Chọn danh mục đi nào.', 'error');
    if (type === 'transfer' && !toWalletId) return toast('Chọn ví đích đi nào.', 'error');
    if (type === 'transfer' && walletId === toWalletId) return toast('Ví nguồn và đích không được giống nhau.', 'error');
    if (isSplit && splitMethod === 'custom' && splitBf + splitGf !== amount) {
      return toast(`Tổng phần chia (${splitBf + splitGf}) phải bằng ${amount}.`, 'error');
    }

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        amount,
        note,
        walletId,
        date,
        createdBy: role,
      };
      if (type !== 'transfer' && categoryId) payload.categoryId = categoryId;
      if (type === 'transfer') payload.toWalletId = toWalletId;
      if (isSplit && type === 'expense') {
        payload.isSplitExpense = true;
        payload.splitMethod = splitMethod;
        payload.paidBy = paidBy;
        payload.splitAmountBoyfriend = splitMethod === 'half' ? splitBf : splitBf;
        payload.splitAmountGirlfriend = splitMethod === 'half' ? splitGf : splitGf;
      }

      await expenseApi.createTransaction(payload as any);
      toast('Đã lưu giao dịch.', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const TYPES: { id: TxType; label: string }[] = [
    { id: 'expense', label: 'Chi tiêu' },
    { id: 'income', label: 'Thu nhập' },
    { id: 'transfer', label: 'Chuyển khoản' },
  ];

  return (
    <AnimatePresence>
      <div className="sheet-shell">
        <motion.div
          className="sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="sheet-panel max-h-[90dvh] overflow-y-auto"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">Ghi giao dịch</h2>
            <div className="flex items-center gap-2">
              {/* Scan receipt button */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={scanning}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 disabled:opacity-50"
                title="Scan ảnh biên lai"
              >
                {scanning ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleScanReceipt}
              />
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
                <X size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Type selector */}
            <div className="flex rounded-full bg-black/5 p-1">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${type === t.id ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-5">
              <AmountInput value={amount} onChange={handleAmountChange} />
            </div>

            {/* Note */}
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú (tuỳ chọn)"
              className="form-input"
            />

            {/* Wallet selector */}
            <div className="flex flex-col gap-1.5">
              <label className="section-label">Ví</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {wallets.map((w) => (
                  <button
                    key={w._id}
                    type="button"
                    onClick={() => setWalletId(w._id)}
                    className={`rounded-[1rem] px-3 py-2 text-left text-xs font-semibold ring-1 transition ${walletId === w._id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Transfer: to wallet */}
            {type === 'transfer' && (
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Ví đích</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {wallets.filter((w) => w._id !== walletId).map((w) => (
                    <button
                      key={w._id}
                      type="button"
                      onClick={() => setToWalletId(w._id)}
                      className={`rounded-[1rem] px-3 py-2 text-left text-xs font-semibold ring-1 transition ${toWalletId === w._id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category (expense/income only) */}
            {type !== 'transfer' && (
              <div className="flex flex-col gap-1.5">
                <label className="section-label">Danh mục</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <CategoryChip
                      key={cat._id}
                      category={cat}
                      selected={categoryId === cat._id}
                      onClick={() => setCategoryId(cat._id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="section-label">Ngày</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="form-input"
              />
            </div>

            {/* Split toggle (expense only) */}
            {type === 'expense' && (
              <div className="flex flex-col gap-3 rounded-[1.25rem] bg-pink-50/60 px-4 py-3">
                <label className="flex cursor-pointer items-center justify-between">
                  <span className="text-sm font-semibold text-ink">Đây là chi tiêu hẹn hò</span>
                  <button
                    type="button"
                    onClick={() => handleSplitToggle(!isSplit)}
                    className={`relative h-6 w-11 rounded-full transition ${isSplit ? 'bg-primary' : 'bg-black/15'}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${isSplit ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </label>

                {isSplit && (
                  <div className="flex flex-col gap-3">
                    {/* Split method */}
                    <div className="flex rounded-full bg-black/5 p-0.5">
                      {(['half', 'custom'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => { setSplitMethod(m); if (m === 'half') handleHalfSplit(amount); }}
                          className={`flex-1 rounded-full py-1 text-xs font-bold transition ${splitMethod === m ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
                        >
                          {m === 'half' ? 'Chia đôi' : 'Tuỳ chỉnh'}
                        </button>
                      ))}
                    </div>

                    {/* Split amounts */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-sky-600">{ROLE_NAME.boyfriend}</label>
                        <input
                          type="number"
                          value={splitBf || ''}
                          readOnly={splitMethod === 'half'}
                          onChange={(e) => setSplitBf(parseInt(e.target.value) || 0)}
                          className="form-input text-sm"
                          placeholder="0"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-pink-600">{ROLE_NAME.girlfriend}</label>
                        <input
                          type="number"
                          value={splitGf || ''}
                          readOnly={splitMethod === 'half'}
                          onChange={(e) => setSplitGf(parseInt(e.target.value) || 0)}
                          className="form-input text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>

                    {/* Who paid */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-soft uppercase tracking-wide">Ai thanh toán?</label>
                      <div className="flex gap-2">
                        {(['boyfriend', 'girlfriend'] as Role[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setPaidBy(r)}
                            className={`flex-1 rounded-full py-1.5 text-xs font-bold ring-1 transition ${paidBy === r ? (r === 'boyfriend' ? 'bg-sky-500 text-white ring-sky-400' : 'bg-pink-500 text-white ring-pink-400') : 'bg-white text-soft ring-black/10'}`}
                          >
                            {ROLE_NAME[r]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-2 w-full"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu giao dịch'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionForm;
