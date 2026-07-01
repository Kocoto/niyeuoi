import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2, Sparkles, ClipboardPaste } from 'lucide-react';
import expenseApi, { type IWallet, type IExpenseCategory } from '../../api/expenseApi';
import AmountInput from './AmountInput';
import CategoryChip from './CategoryChip';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { formatVNDCompact } from '../../utils/currency';

interface NotificationImportSheetProps {
  wallets: IWallet[];
  categories: IExpenseCategory[];
  defaultWalletId?: string;
  initialText?: string;
  onClose: () => void;
  onSaved: () => void;
}

const NotificationImportSheet: React.FC<NotificationImportSheetProps> = ({
  wallets, categories, defaultWalletId, initialText, onClose, onSaved,
}) => {
  const { role } = useAuth();
  const { toast } = useUI();

  const [rawText, setRawText] = useState(initialText ?? '');
  const [parsing, setParsing] = useState(false);
  const didAutoParseRef = useRef(false);

  const [parsed, setParsed] = useState<{
    amount: number | null;
    type: 'income' | 'expense' | null;
    merchant: string | null;
    bankName: string | null;
    date: string | null;
  } | null>(null);

  // Editable after parse
  const [amount, setAmount] = useState(0);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [walletId, setWalletId] = useState(defaultWalletId ?? wallets[0]?._id ?? '');
  const [categoryId, setCategoryId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Nếu có initialText từ Android share → tự động parse ngay sau khi mount
  useEffect(() => {
    if (!initialText || didAutoParseRef.current) return;
    didAutoParseRef.current = true;
    setParsing(true);
    expenseApi.parseText(initialText)
      .then((res) => {
        const d = res.data.data;
        setParsed(d);
        if (d.amount) setAmount(d.amount);
        if (d.type) setType(d.type);
        if (d.merchant) setNote(d.merchant);
        if (d.date) setDate(d.date.slice(0, 10));
      })
      .catch(() => toast('AI chưa đọc được. Thử lại nhé.', 'error'))
      .finally(() => setParsing(false));
  // mount-only, initialText là prop tĩnh
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setRawText(text);
    } catch {
      toast('Không đọc được clipboard. Dán tay nhé.', 'error');
    }
  };

  const handleParse = async () => {
    if (!rawText.trim()) return toast('Dán nội dung thông báo vào trước nhé.', 'error');
    setParsing(true);
    try {
      const res = await expenseApi.parseText(rawText);
      const d = res.data.data;
      setParsed(d);
      if (d.amount) setAmount(d.amount);
      if (d.type) setType(d.type);
      if (d.merchant) setNote(d.merchant);
      if (d.date) setDate(d.date.slice(0, 10));
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'AI chưa đọc được. Thử lại nhé.', 'error');
    } finally {
      setParsing(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return toast('Nhập số tiền nhé.', 'error');
    if (!walletId) return toast('Chọn ví nhé.', 'error');
    setSubmitting(true);
    try {
      await expenseApi.createTransaction({
        type,
        amount,
        note: note || undefined,
        walletId: walletId as any,
        categoryId: (categoryId || undefined) as any,
        date,
        createdBy: role as any,
      });
      toast('Đã lưu giao dịch!', 'success');
      onSaved();
      onClose();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa lưu được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sheet-shell">
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="sheet-backdrop"
        aria-label="Đóng"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        className="sheet-panel max-h-[92dvh] overflow-y-auto"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black text-ink">Nhập từ thông báo</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-soft">
            <X size={18} />
          </button>
        </div>

        {/* Step 1: Paste area */}
        <div className="mb-4 flex flex-col gap-2">
          <label className="section-label">Nội dung thông báo ngân hàng / ví</label>
          <div className="relative">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={4}
              placeholder="Dán nội dung SMS hoặc thông báo ngân hàng vào đây..."
              className="form-input w-full resize-none text-sm"
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-2 top-2 rounded-lg bg-black/5 p-1.5 text-soft hover:bg-black/10"
              aria-label="Dán từ clipboard"
            >
              <ClipboardPaste size={14} />
            </button>
          </div>
          <button
            type="button"
            onClick={handleParse}
            disabled={parsing || !rawText.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            {parsing
              ? <><Loader2 size={15} className="animate-spin" /> Đang đọc...</>
              : <><Sparkles size={15} /> AI đọc số tiền</>}
          </button>
        </div>

        {/* Step 2: Editable result + save */}
        {parsed && (
          <form onSubmit={handleSave} className="flex flex-col gap-4 border-t border-black/5 pt-4">
            {parsed.bankName && (
              <p className="text-xs text-soft">
                Phát hiện: <span className="font-semibold text-ink">{parsed.bankName}</span>
                {parsed.merchant && <> · {parsed.merchant}</>}
              </p>
            )}

            {/* Type toggle */}
            <div className="flex rounded-2xl bg-black/5 p-1">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${type === t ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
                >
                  {t === 'expense' ? '🔴 Chi tiêu' : '🟢 Thu nhập'}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div>
              <label className="section-label mb-1.5 block">Số tiền</label>
              <div className="surface-card p-4">
                <AmountInput value={amount} onChange={setAmount} />
              </div>
              {parsed.amount && parsed.amount !== amount && (
                <button
                  type="button"
                  onClick={() => setAmount(parsed.amount!)}
                  className="mt-1 text-xs text-primary underline"
                >
                  Dùng số AI đọc được: {formatVNDCompact(parsed.amount)}
                </button>
              )}
            </div>

            {/* Note + Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="section-label mb-1.5 block">Ghi chú</label>
                <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Mô tả..." className="form-input w-full" />
              </div>
              <div>
                <label className="section-label mb-1.5 block">Ngày</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="form-input w-full" />
              </div>
            </div>

            {/* Wallet */}
            <div>
              <label className="section-label mb-1.5 block">Ví</label>
              <div className="grid grid-cols-2 gap-2">
                {wallets.map((w) => (
                  <button
                    key={w._id}
                    type="button"
                    onClick={() => setWalletId(w._id)}
                    className={`rounded-[1rem] px-3 py-2 text-left text-xs font-semibold ring-1 transition ${walletId === w._id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-black/[0.03] text-soft ring-transparent'}`}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="section-label mb-1.5 block">Danh mục</label>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.name !== 'Trả nợ')
                  .map((cat) => (
                    <CategoryChip
                      key={cat._id}
                      category={cat}
                      selected={categoryId === cat._id}
                      onClick={() => setCategoryId((id) => id === cat._id ? '' : cat._id)}
                    />
                  ))}
              </div>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu giao dịch'}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default NotificationImportSheet;
