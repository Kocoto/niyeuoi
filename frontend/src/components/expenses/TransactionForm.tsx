import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Loader2, X } from 'lucide-react';
import AmountInput from './AmountInput';
import CategoryChip from './CategoryChip';
import type { IWallet, IExpenseCategory, ITransaction } from '../../api/expenseApi';
import expenseApi from '../../api/expenseApi';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

interface TransactionFormProps {
  wallets: IWallet[];
  categories: IExpenseCategory[];
  onClose: () => void;
  onSaved: () => void;
  defaultType?: 'income' | 'expense' | 'transfer';
  defaultWalletId?: string;
  editingTx?: ITransaction | null;
}

type TxType = 'income' | 'expense' | 'transfer';

function idOf(ref: IWallet | IExpenseCategory | string | undefined): string {
  if (!ref) return '';
  if (typeof ref === 'object') return (ref as { _id: string })._id;
  return ref;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ wallets, categories, onClose, onSaved, defaultType = 'expense', defaultWalletId, editingTx }) => {
  const { role } = useAuth();
  const { toast } = useUI();
  const isEditing = !!editingTx;

  const [type, setType] = useState<TxType>(editingTx?.type ?? defaultType);
  const [amount, setAmount] = useState(editingTx?.amount ?? 0);
  const [note, setNote] = useState(editingTx?.note ?? '');
  const [walletId, setWalletId] = useState(idOf(editingTx?.walletId) || defaultWalletId || wallets[0]?._id || '');
  const [toWalletId, setToWalletId] = useState(idOf(editingTx?.toWalletId));
  const [categoryId, setCategoryId] = useState(idOf(editingTx?.categoryId));
  const [date, setDate] = useState((editingTx?.date ?? new Date().toISOString()).slice(0, 10));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast('Nhập số tiền trước nhé.', 'error');
    if (!walletId) return toast('Chọn ví đi nào.', 'error');
    if (type === 'expense' && !categoryId) return toast('Chọn danh mục đi nào.', 'error');
    if (type === 'transfer' && !toWalletId) return toast('Chọn ví đích đi nào.', 'error');
    if (type === 'transfer' && walletId === toWalletId) return toast('Ví nguồn và đích không được giống nhau.', 'error');

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { type, amount, note, walletId, date };
      if (type !== 'transfer') payload.categoryId = categoryId || undefined;
      if (type === 'transfer') payload.toWalletId = toWalletId;

      if (isEditing) {
        await expenseApi.updateTransaction(editingTx!._id, payload as any);
        toast('Đã cập nhật giao dịch.', 'success');
      } else {
        payload.createdBy = role;
        await expenseApi.createTransaction(payload as any);
        toast('Đã lưu giao dịch.', 'success');
      }
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
            <h2 className="text-lg font-bold text-ink">{isEditing ? 'Sửa giao dịch' : 'Ghi giao dịch'}</h2>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
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
                </>
              )}
              <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 transition hover:bg-black/10">
                <X size={16} />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Type selector — khoá khi đang sửa */}
            <div className="flex rounded-full bg-black/5 p-1">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => !isEditing && setType(t.id)}
                  disabled={isEditing && type !== t.id}
                  className={`flex-1 rounded-full py-1.5 text-xs font-bold transition ${type === t.id ? 'bg-white text-ink shadow-sm' : 'text-soft'} ${isEditing ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-5">
              <AmountInput value={amount} onChange={setAmount} />
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
              <label className="section-label">{type === 'transfer' ? 'Ví nguồn' : 'Ví'}</label>
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

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary mt-2 w-full"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : (isEditing ? 'Cập nhật' : 'Lưu giao dịch')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TransactionForm;
