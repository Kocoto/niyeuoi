import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2, CornerDownLeft, Loader2 } from 'lucide-react';
import PersonBadge from '../components/PersonBadge';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { isRole, ROLE_NAME, type Role } from '../constants/roles';

interface ILetter {
  _id: string;
  content: string;
  createdBy: Role;
  reply?: string;
  repliedBy?: Role;
  repliedAt?: string;
  createdAt: string;
}

const Letters: React.FC = () => {
  const [letters, setLetters] = useState<ILetter[]>([]);
  const [loading, setLoading] = useState(true);
  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyingSubmitting, setReplyingSubmitting] = useState(false);

  const fetchLetters = useCallback(async () => {
    try {
      const res = await api.get('/letters');
      setLetters(res.data.data ?? []);
    } catch {
      toast('Chưa tải được danh sách.', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchLetters();
  }, [fetchLetters]);

  const handleCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeText.trim()) return;
    setSubmitting(true);
    try {
      await api.post('/letters', { content: composeText.trim(), createdBy: role });
      setComposeText('');
      setShowCompose(false);
      toast('Đã gửi lời muốn nói.', 'success');
      await fetchLetters();
    } catch {
      toast('Chưa gửi được lần này.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) return;
    setReplyingSubmitting(true);
    try {
      await api.put(`/letters/${id}/reply`, { reply: replyText.trim(), repliedBy: role });
      setReplyingId(null);
      setReplyText('');
      toast('Đã hồi âm.', 'success');
      await fetchLetters();
    } catch {
      toast('Chưa hồi âm được lần này.', 'error');
    } finally {
      setReplyingSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!await confirm('Xóa lời này đi? 🥺')) return;
    try {
      await api.delete(`/letters/${id}`);
      await fetchLetters();
    } catch {
      toast('Chưa xóa được.', 'error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-2 md:px-4 py-6 md:py-8 pb-24 md:pb-8">
      <div className="page-header">
        <div>
          <h1 className="page-title">Lời muốn nói</h1>
          <p className="page-subtitle">Nơi để nói ra điều đang nghĩ — dù nhỏ hay lớn, đối phương sẽ thấy và có thể hồi âm.</p>
          <div className="mt-3">
            <PersonBadge role={role} prefix="Góc của" />
          </div>
        </div>
        <button
          onClick={() => { setShowCompose(true); setComposeText(''); }}
          className="btn-add"
        >
          <Plus size={20} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={40} />
        </div>
      ) : letters.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm font-medium">
          Chưa có lời nào được viết ra. Hãy là người đầu tiên.
        </div>
      ) : (
        <div className="space-y-4">
          {letters.map((letter, index) => {
            const isOwn = letter.createdBy === role;
            const canReply = !letter.reply && !isOwn;
            const isReplying = replyingId === letter._id;

            return (
              <motion.div
                key={letter._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-pink-50 p-5 md:p-6 hover:shadow-md transition-shadow group relative">
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(letter._id)}
                      className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-400 transition-colors md:opacity-0 md:group-hover:opacity-100"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}

                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {isRole(letter.createdBy) ? (
                      <PersonBadge role={letter.createdBy} prefix="Góc của" />
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-stone-100 px-3 py-1.5 text-xs font-bold text-stone-500 ring-1 ring-stone-200">
                        Đã thêm trước đây
                      </span>
                    )}
                    <span className="text-[11px] text-gray-400">
                      {new Date(letter.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long' })}
                    </span>
                  </div>

                  <p className="text-gray-700 leading-relaxed text-sm whitespace-pre-wrap">{letter.content}</p>

                  {letter.reply && isRole(letter.repliedBy) && (
                    <div className="mt-4 pl-4 border-l-2 border-pink-100">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <CornerDownLeft size={12} className="text-pink-300" />
                        <PersonBadge role={letter.repliedBy!} prefix="Hồi âm của" />
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">{letter.reply}</p>
                    </div>
                  )}

                  {canReply && !isReplying && (
                    <button
                      onClick={() => { setReplyingId(letter._id); setReplyText(''); }}
                      className="mt-4 text-[11px] font-bold text-primary/70 hover:text-primary transition-colors flex items-center gap-1"
                    >
                      <CornerDownLeft size={12} />
                      Hồi âm
                    </button>
                  )}

                  {isReplying && (
                    <div className="mt-4 space-y-2">
                      <textarea
                        autoFocus
                        rows={3}
                        className="w-full bg-gray-50 p-3 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-primary transition-all resize-none"
                        placeholder="Viết điều muốn nói lại..."
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(letter._id)}
                          disabled={replyingSubmitting || !replyText.trim()}
                          className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-xl disabled:opacity-50"
                        >
                          {replyingSubmitting ? 'Đang gửi...' : `Gửi từ ${ROLE_NAME[role]}`}
                        </button>
                        <button
                          onClick={() => { setReplyingId(null); setReplyText(''); }}
                          className="px-4 py-2.5 bg-gray-100 text-gray-500 text-xs font-bold rounded-xl"
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal viết lời */}
      <AnimatePresence>
        {showCompose && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCompose(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 24 }}
              className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-800 font-romantic">Nói điều đang nghĩ 💬</h2>
                <button type="button" onClick={() => setShowCompose(false)}><X size={20} /></button>
              </div>
              <form onSubmit={handleCompose} className="space-y-4">
                <div className="space-y-1">
                  <PersonBadge role={role} prefix="Góc của" />
                  <p className="text-xs text-gray-400">Lời này sẽ gắn với người đang viết.</p>
                </div>
                <textarea
                  autoFocus
                  required
                  rows={5}
                  className="w-full bg-gray-50 p-4 rounded-2xl outline-none text-sm border-2 border-transparent focus:border-primary transition-all resize-none"
                  placeholder="Bạn muốn nói gì hôm nay..."
                  value={composeText}
                  onChange={e => setComposeText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={submitting || !composeText.trim()}
                  className="w-full bg-primary text-white font-bold py-4 rounded-2xl shadow-lg disabled:opacity-50"
                >
                  {submitting ? 'Đang gửi...' : 'Gửi lời muốn nói ❤️'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Letters;
