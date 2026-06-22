import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, X, Loader2 } from 'lucide-react';
import expenseApi, { type ISavingsGoal, type IWallet } from '../api/expenseApi';
import SavingsGoalCard from '../components/expenses/SavingsGoalCard';
import AmountInput from '../components/expenses/AmountInput';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';

const ExpenseSavings: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();
  const [goals, setGoals] = useState<ISavingsGoal[]>([]);
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [depositGoal, setDepositGoal] = useState<ISavingsGoal | null>(null);

  // Create form state
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState(0);
  const [deadline, setDeadline] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Deposit state
  const [depositAmount, setDepositAmount] = useState(0);
  const [depositWallet, setDepositWallet] = useState('');
  const [depositing, setDepositing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [gr, wr] = await Promise.all([expenseApi.getSavingsGoals(), expenseApi.getWallets()]);
      setGoals(gr.data.data ?? []);
      setWallets(wr.data.data ?? []);
      if (wr.data.data?.[0]) setDepositWallet(wr.data.data[0]._id);
    } catch {
      toast('Chưa tải được dữ liệu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast('Nhập tên mục tiêu nhé.', 'error');
    if (!targetAmount || targetAmount <= 0) return toast('Nhập số tiền mục tiêu nhé.', 'error');
    setSubmitting(true);
    try {
      await expenseApi.createSavingsGoal({ name: name.trim(), targetAmount, deadline: deadline || undefined, note: note || undefined, createdBy: role as any });
      toast('Đã tạo mục tiêu.', 'success');
      setShowCreate(false);
      setName(''); setTargetAmount(0); setDeadline(''); setNote('');
      fetchAll();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa tạo được.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    if (!depositAmount || depositAmount <= 0) return toast('Nhập số tiền nhé.', 'error');
    if (!depositWallet) return toast('Chọn ví nhé.', 'error');
    setDepositing(true);
    try {
      await expenseApi.depositToGoal(depositGoal._id, depositAmount, depositWallet);
      toast('Đã nạp tiền vào mục tiêu!', 'success');
      setDepositGoal(null);
      setDepositAmount(0);
      fetchAll();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa nạp được.', 'error');
    } finally {
      setDepositing(false);
    }
  };

  const handleDelete = async (goal: ISavingsGoal) => {
    const ok = await confirm(`Xóa mục tiêu "${goal.name}"?`, 'Hành động này không thể hoàn tác.');
    if (!ok) return;
    try {
      await expenseApi.deleteSavingsGoal(goal._id);
      toast('Đã xóa.', 'success');
      fetchAll();
    } catch {
      toast('Chưa xóa được.', 'error');
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Mục tiêu tiết kiệm</h1>
          <p className="page-subtitle">Cùng nhau để dành cho những điều đáng mong đợi</p>
        </div>
        <button type="button" onClick={() => setShowCreate(true)} className="btn-add">
          <Plus size={20} />
        </button>
      </div>

      {!loading && goals.length === 0 ? (
        <div className="empty-state">
          <p className="text-sm font-semibold text-soft">Chưa có mục tiêu nào</p>
          <p className="mt-2 text-xs text-soft/70">Nhấn + để tạo mục tiêu tiết kiệm đầu tiên nhé.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((goal) => (
            <motion.div key={goal._id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <SavingsGoalCard
                goal={goal}
                onDeposit={() => { setDepositGoal(goal); setDepositAmount(0); }}
                onDelete={() => handleDelete(goal)}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Create goal modal */}
      <AnimatePresence>
        {showCreate && (
          <div className="sheet-shell">
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreate(false)} />
            <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink">Mục tiêu mới</h2>
                <button type="button" onClick={() => setShowCreate(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên mục tiêu (VD: Đi Đà Lạt)" className="form-input" />
                <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-5">
                  <p className="mb-2 text-center text-[11px] text-soft">Cần bao nhiêu?</p>
                  <AmountInput value={targetAmount} onChange={setTargetAmount} />
                </div>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="form-input" />
                <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ghi chú (tuỳ chọn)" rows={2} className="form-input resize-none" />
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : 'Tạo mục tiêu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit modal */}
      <AnimatePresence>
        {depositGoal && (
          <div className="sheet-shell">
            <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDepositGoal(null)} />
            <motion.div className="sheet-panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 28, stiffness: 260 }}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-ink">Nạp tiền</h2>
                  <p className="text-xs text-soft">{depositGoal.name}</p>
                </div>
                <button type="button" onClick={() => setDepositGoal(null)} className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleDeposit} className="flex flex-col gap-4">
                <div className="rounded-[1.25rem] bg-[#faf5f8] px-4 py-5">
                  <AmountInput value={depositAmount} onChange={setDepositAmount} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="section-label">Rút từ ví</label>
                  <div className="grid grid-cols-2 gap-2">
                    {wallets.map((w) => (
                      <button
                        key={w._id}
                        type="button"
                        onClick={() => setDepositWallet(w._id)}
                        className={`rounded-[1rem] px-3 py-2 text-left text-xs font-semibold ring-1 transition ${depositWallet === w._id ? 'bg-primary/10 text-primary ring-primary/40' : 'bg-[#faf5f8] text-soft ring-transparent'}`}
                      >
                        {w.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={depositing} className="btn-primary w-full">
                  {depositing ? <Loader2 size={16} className="animate-spin" /> : 'Nạp vào mục tiêu'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseSavings;
