import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Loader2 } from 'lucide-react';
import expenseApi, {
  type IDebt, type IWallet, type DebtOwner, type PayoffProjection, type PayoffProjectionItem,
} from '../api/expenseApi';
import DebtCard from '../components/expenses/DebtCard';
import DebtForm from '../components/expenses/DebtForm';
import AmountInput from '../components/expenses/AmountInput';
import { useUI } from '../context/UIContext';
import { formatVNDCompact } from '../utils/currency';
import { ROLE_NAME } from '../constants/roles';

const OWNER_TABS: { id: DebtOwner; label: string }[] = [
  { id: 'shared', label: 'Quỹ chung' },
  { id: 'boyfriend', label: ROLE_NAME.boyfriend },
  { id: 'girlfriend', label: ROLE_NAME.girlfriend },
];

const ProjectionItem: React.FC<{ item: PayoffProjectionItem }> = ({ item }) => (
  <div className="flex flex-col gap-1 rounded-[1.25rem] px-4 py-3 hover:bg-black/[0.02]">
    <div className="flex items-center justify-between">
      <p className="font-semibold text-ink">{item.name}</p>
      <span className="text-xs font-bold text-soft">
        {item.monthsLeft > 0 ? `~${item.monthsLeft} tháng` : 'Không xác định'}
      </span>
    </div>
    <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-soft">
      <span>Còn lại: {formatVNDCompact(item.remainingAmount)}</span>
      <span>Trả {formatVNDCompact(item.monthlyPayment)}/tháng</span>
      {item.totalInterest > 0 && <span className="text-rose-500">Lãi dự tính: {formatVNDCompact(item.totalInterest)}</span>}
    </div>
  </div>
);

const ExpenseDebts: React.FC = () => {
  const { toast, confirm } = useUI();

  const [ownerTab, setOwnerTab] = useState<DebtOwner>('shared');
  const [debts, setDebts] = useState<IDebt[]>([]);
  const [wallets, setWallets] = useState<IWallet[]>([]);
  const [projection, setProjection] = useState<PayoffProjection | null>(null);
  const [loading, setLoading] = useState(true);

  // Forms / sheets
  const [showForm, setShowForm] = useState(false);
  const [editingDebt, setEditingDebt] = useState<IDebt | null>(null);

  // Pay sheet
  const [payDebt, setPayDebt] = useState<IDebt | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payWalletId, setPayWalletId] = useState('');
  const [paying, setPaying] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [debtsRes, walletsRes, projRes] = await Promise.all([
        expenseApi.getDebts(ownerTab),
        expenseApi.getWallets(),
        expenseApi.getDebtProjection(ownerTab),
      ]);
      setDebts(debtsRes.data.data ?? []);
      setWallets(walletsRes.data.data ?? []);
      setProjection(projRes.data.data ?? null);
      const firstWallet = walletsRes.data.data?.[0];
      if (firstWallet) setPayWalletId(firstWallet._id);
    } catch {
      toast('Chưa tải được dữ liệu nợ.', 'error');
    } finally {
      setLoading(false);
    }
  }, [ownerTab, toast]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (debt: IDebt) => {
    const ok = await confirm(`Xóa khoản nợ "${debt.name}"?`);
    if (!ok) return;
    try {
      await expenseApi.deleteDebt(debt._id);
      toast('Đã xóa khoản nợ.', 'success');
      fetchAll();
    } catch {
      toast('Chưa xóa được.', 'error');
    }
  };

  const openPay = (debt: IDebt) => {
    setPayDebt(debt);
    setPayAmount(debt.monthlyPayment);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDebt) return;
    if (!payAmount || payAmount <= 0) return toast('Nhập số tiền trả nhé.', 'error');
    if (!payWalletId) return toast('Chọn ví nhé.', 'error');
    setPaying(true);
    try {
      await expenseApi.payDebt(payDebt._id, payAmount, payWalletId);
      toast(`Đã trả ${formatVNDCompact(payAmount)} cho "${payDebt.name}".`, 'success');
      setPayDebt(null);
      setPayAmount(0);
      fetchAll();
    } catch (err: any) {
      toast(err?.response?.data?.error ?? 'Chưa trả được.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const activeDebts = debts.filter((d) => d.isActive);
  const closedDebts = debts.filter((d) => !d.isActive);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý nợ</h1>
          <p className="page-subtitle">Theo dõi và trả nợ từng tháng</p>
        </div>
        <button type="button" onClick={() => { setEditingDebt(null); setShowForm(true); }} className="btn-add" aria-label="Thêm khoản nợ">
          <Plus size={20} />
        </button>
      </div>

      {/* Owner tabs */}
      <div className="mb-4 flex rounded-full bg-black/5 p-1">
        {OWNER_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setOwnerTab(t.id)}
            className={`flex-1 rounded-full py-2 text-sm font-bold transition ${ownerTab === t.id ? 'bg-white text-ink shadow-sm' : 'text-soft'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-soft" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Active debts */}
          {activeDebts.length === 0 && closedDebts.length === 0 && (
            <div className="surface-card py-12 text-center text-sm text-soft">
              Chưa có khoản nợ nào. Nhấn <span className="font-bold">+</span> để thêm.
            </div>
          )}

          {activeDebts.length > 0 && (
            <section className="flex flex-col gap-3">
              {activeDebts.map((d) => (
                <DebtCard
                  key={d._id}
                  debt={d}
                  onPay={() => openPay(d)}
                  onEdit={() => { setEditingDebt(d); setShowForm(true); }}
                  onDelete={() => handleDelete(d)}
                />
              ))}
            </section>
          )}

          {/* Payoff projection */}
          {projection && projection.items.length > 0 && (
            <section className="surface-card overflow-hidden p-0">
              <div className="px-4 pt-4 pb-2">
                <p className="section-label">Dự báo trả hết nợ</p>
              </div>
              <div className="divide-y divide-black/[0.04]">
                {projection.items.map((item) => (
                  <ProjectionItem key={item.debtId} item={item} />
                ))}
              </div>
              {projection.items.length >= 2 && (
                <div className="border-t border-black/5 px-4 py-3 text-[11px] text-soft">
                  <span className="font-bold text-ink">Snowball</span> (trả nhỏ trước): {projection.snowball.join(' → ')}
                  <span className="mx-2">·</span>
                  <span className="font-bold text-ink">Avalanche</span> (lãi cao trước): {projection.avalanche.join(' → ')}
                </div>
              )}
            </section>
          )}

          {/* Closed debts */}
          {closedDebts.length > 0 && (
            <section>
              <p className="section-label mb-3">Đã trả xong</p>
              <div className="flex flex-col gap-3">
                {closedDebts.map((d) => (
                  <DebtCard
                    key={d._id}
                    debt={d}
                    onPay={() => {}}
                    onEdit={() => {}}
                    onDelete={() => handleDelete(d)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Debt Form sheet */}
      <AnimatePresence>
        {showForm && (
          <DebtForm
            debt={editingDebt}
            wallets={wallets}
            onClose={() => { setShowForm(false); setEditingDebt(null); }}
            onSaved={fetchAll}
          />
        )}
      </AnimatePresence>

      {/* Pay sheet */}
      <AnimatePresence>
        {payDebt && (
          <div className="sheet-shell">
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPayDebt(null)}
              className="sheet-backdrop"
              aria-label="Đóng"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 34 }}
              className="sheet-panel"
            >
              <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-rose-100" />
              <h2 className="mb-5 text-lg font-black text-ink">Trả nợ: {payDebt.name}</h2>
              <form onSubmit={handlePay} className="flex flex-col gap-4">
                <div>
                  <label className="section-label mb-1.5 block">Số tiền trả</label>
                  <div className="surface-card p-4">
                    <AmountInput value={payAmount} onChange={setPayAmount} />
                  </div>
                </div>
                <div>
                  <label className="section-label mb-1.5 block">Từ ví</label>
                  <select
                    value={payWalletId}
                    onChange={(e) => setPayWalletId(e.target.value)}
                    className="form-input w-full"
                  >
                    {wallets.map((w) => (
                      <option key={w._id} value={w._id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-soft">
                  Còn lại sau khi trả: <span className="font-bold text-ink">{formatVNDCompact(Math.max(0, payDebt.remainingAmount - payAmount))}</span>
                </p>
                <button type="submit" disabled={paying} className="btn-primary w-full disabled:opacity-60">
                  {paying ? <Loader2 size={16} className="animate-spin" /> : 'Xác nhận trả nợ'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpenseDebts;
