import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import expenseApi, { type IDebt, type DebtOwner, type IWallet } from '../../api/expenseApi';
import AmountInput from './AmountInput';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';

interface DebtFormProps {
  debt?: IDebt | null;
  wallets: IWallet[];
  onClose: () => void;
  onSaved: () => void;
}

const OWNER_OPTIONS: { value: DebtOwner; label: string }[] = [
  { value: 'shared', label: 'Quỹ chung' },
  { value: 'boyfriend', label: 'Của Được' },
  { value: 'girlfriend', label: 'Của Ni' },
];

const DebtForm: React.FC<DebtFormProps> = ({ debt, wallets, onClose, onSaved }) => {
  const { role } = useAuth();
  const { toast } = useUI();

  const [name, setName] = useState(debt?.name ?? '');
  const [creditor, setCreditor] = useState(debt?.creditor ?? '');
  const [totalAmount, setTotalAmount] = useState(debt?.totalAmount ?? 0);
  const [remainingAmount, setRemainingAmount] = useState(debt?.remainingAmount ?? 0);
  const [monthlyPayment, setMonthlyPayment] = useState(debt?.monthlyPayment ?? 0);
  const [dueDayOfMonth, setDueDayOfMonth] = useState<string>(String(debt?.dueDayOfMonth ?? ''));
  const [interestRate, setInterestRate] = useState<string>(String(debt?.interestRate ?? ''));
  const [owner, setOwner] = useState<DebtOwner>(debt?.owner ?? 'shared');
  const [walletId, setWalletId] = useState(debt?.walletId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const isEdit = !!debt;

  useEffect(() => {
    // new debt: remainingAmount defaults to totalAmount
    if (!isEdit) setRemainingAmount(totalAmount);
  }, [totalAmount, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('Nhập tên khoản nợ nhé.', 'error');
    if (!totalAmount || totalAmount <= 0) return toast('Nhập tổng nợ nhé.', 'error');
    if (!monthlyPayment || monthlyPayment <= 0) return toast('Nhập số phải trả hàng tháng nhé.', 'error');

    const payload: Partial<IDebt> = {
      name: name.trim(),
      creditor: creditor.trim() || undefined,
      totalAmount,
      monthlyPayment,
      owner,
      walletId: walletId || undefined,
      dueDayOfMonth: dueDayOfMonth ? Number(dueDayOfMonth) : undefined,
      interestRate: interestRate ? Number(interestRate) : undefined,
      createdBy: role as any,
    };
    if (!isEdit) payload.remainingAmount = remainingAmount;

    setSubmitting(true);
    try {
      if (isEdit) {
        await expenseApi.updateDebt(debt._id, payload);
      } else {
        await expenseApi.createDebt(payload);
      }
      toast(isEdit ? 'Đã cập nhật khoản nợ.' : 'Đã thêm khoản nợ.', 'success');
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
        className="sheet-panel overflow-y-auto max-h-[90vh]"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100" />
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-black text-ink">{isEdit ? 'Sửa khoản nợ' : 'Thêm khoản nợ'}</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-soft">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="section-label mb-1.5 block">Tên khoản nợ *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Thẻ tín dụng VPBank..."
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="section-label mb-1.5 block">Chủ nợ / Ngân hàng</label>
            <input
              type="text"
              value={creditor}
              onChange={(e) => setCreditor(e.target.value)}
              placeholder="VD: VPBank, MB..."
              className="form-input w-full"
            />
          </div>

          <div>
            <label className="section-label mb-1.5 block">Tổng nợ *</label>
            <div className="surface-card p-4">
              <AmountInput value={totalAmount} onChange={setTotalAmount} />
            </div>
          </div>

          {!isEdit && (
            <div>
              <label className="section-label mb-1.5 block">Còn lại phải trả</label>
              <div className="surface-card p-4">
                <AmountInput value={remainingAmount} onChange={setRemainingAmount} />
              </div>
              <p className="mt-1 text-xs text-soft">Mặc định bằng tổng nợ nếu chưa trả kỳ nào.</p>
            </div>
          )}

          <div>
            <label className="section-label mb-1.5 block">Phải trả hàng tháng *</label>
            <div className="surface-card p-4">
              <AmountInput value={monthlyPayment} onChange={setMonthlyPayment} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="section-label mb-1.5 block">Ngày đến hạn</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDayOfMonth}
                onChange={(e) => setDueDayOfMonth(e.target.value)}
                placeholder="1–31"
                className="form-input w-full"
              />
            </div>
            <div>
              <label className="section-label mb-1.5 block">Lãi suất (%/năm)</label>
              <input
                type="number"
                min={0}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0"
                className="form-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="section-label mb-1.5 block">Thuộc về</label>
            <div className="flex rounded-2xl bg-black/5 p-1">
              {OWNER_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setOwner(o.value)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${owner === o.value ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {wallets.length > 0 && (
            <div>
              <label className="section-label mb-1.5 block">Ví thanh toán (tuỳ chọn)</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="form-input w-full"
              >
                <option value="">— Không chọn —</option>
                {wallets.map((w) => (
                  <option key={w._id} value={w._id}>{w.name}</option>
                ))}
              </select>
            </div>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : isEdit ? 'Lưu thay đổi' : 'Thêm khoản nợ'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default DebtForm;
