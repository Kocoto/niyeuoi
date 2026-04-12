import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, Loader2, NotebookPen, Pencil, Plus, Trash2 } from 'lucide-react';
import api from '../api/api';
import EmptyState from '../components/EmptyState';
import RolePill from '../components/RolePill';
import SheetDialog from '../components/SheetDialog';
import type { AppRole } from '../constants/appRoles';
import { ROLE_NAME } from '../constants/appRoles';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { formatCompactDate, formatFullDate, getTimelineBucket, getTimelineBucketLabel } from '../utils/date';

type Memory = {
  _id: string;
  title: string;
  date: string;
  content: string;
  media: string[];
  mood: string;
  createdBy?: AppRole;
  createdAt?: string;
};

type MemoryFormState = {
  title: string;
  date: string;
  content: string;
  media: string;
  mood: string;
  createdBy: AppRole;
};

const moodOptions = ['Hạnh phúc', 'Đang yêu', 'Bình yên', 'Cảm động', 'Vui vẻ'];

const createInitialForm = (role: AppRole): MemoryFormState => ({
  title: '',
  date: new Date().toISOString().split('T')[0],
  content: '',
  media: '',
  mood: 'Hạnh phúc',
  createdBy: role,
});

const TimelineV2: React.FC = () => {
  const { role } = useAuth();
  const { toast, confirm } = useUI();

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [formData, setFormData] = useState<MemoryFormState>(createInitialForm(role as AppRole));

  const fetchMemories = async () => {
    try {
      const response = await api.get('/memories');
      setMemories(response.data.data ?? []);
    } catch {
      toast('Chưa tải được dòng kỷ niệm.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMemories();
  }, []);

  const groupedMemories = useMemo(() => {
    const groups: Record<'today' | 'week' | 'month' | 'earlier', Memory[]> = {
      today: [],
      week: [],
      month: [],
      earlier: [],
    };

    [...memories]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .forEach(memory => {
        groups[getTimelineBucket(memory.date)].push(memory);
      });

    return groups;
  }, [memories]);

  const summary = useMemo(() => {
    return {
      total: memories.length,
      girlfriend: memories.filter(memory => (memory.createdBy ?? 'girlfriend') === 'girlfriend').length,
      boyfriend: memories.filter(memory => (memory.createdBy ?? 'girlfriend') === 'boyfriend').length,
    };
  }, [memories]);

  const openCreateEditor = () => {
    setEditingId(null);
    setFormData(createInitialForm(role as AppRole));
    setSelectedFile(null);
    setPreviewUrl('');
    setShowEditor(true);
  };

  const openEditEditor = (memory: Memory) => {
    setEditingId(memory._id);
    setFormData({
      title: memory.title,
      date: new Date(memory.date).toISOString().split('T')[0],
      content: memory.content,
      media: memory.media?.[0] ?? '',
      mood: memory.mood || 'Hạnh phúc',
      createdBy: (memory.createdBy ?? 'girlfriend') as AppRole,
    });
    setSelectedFile(null);
    setPreviewUrl(memory.media?.[0] ?? '');
    setShowEditor(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const closeEditor = () => {
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    setShowEditor(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setFormData(createInitialForm(role as AppRole));
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setUploading(true);

    try {
      let mediaUrl = formData.media;

      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append('image', selectedFile);
        const response = await api.post('/upload', uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        mediaUrl = response.data.data.url;
      }

      const payload = {
        ...formData,
        media: mediaUrl ? [mediaUrl] : [],
      };

      if (editingId) {
        await api.put(`/memories/${editingId}`, payload);
      } else {
        await api.post('/memories', payload);
      }

      closeEditor();
      await fetchMemories();
      toast(editingId ? 'Đã cập nhật kỷ niệm.' : 'Đã ghi lại một kỷ niệm mới.', 'success');
    } catch {
      toast('Chưa lưu được kỷ niệm lần này.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    if (!await confirm('Bạn có muốn xoá kỷ niệm này không?')) return;

    try {
      await api.delete(`/memories/${id}`);
      if (selectedMemory?._id === id) {
        setSelectedMemory(null);
        setShowDetail(false);
      }
      await fetchMemories();
      toast('Đã xoá kỷ niệm.', 'success');
    } catch {
      toast('Chưa xoá được kỷ niệm này.', 'error');
    }
  };

  const canManageMemory = (memory: Memory) => {
    return role === 'boyfriend' || (memory.createdBy ?? 'girlfriend') === role;
  };

  return (
    <div className="page-container space-y-4">
      <section className="surface-card-strong overflow-hidden p-5 md:p-7">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="section-label">Timeline</p>
            <h1 className="page-title mt-2">Dòng kỷ niệm</h1>
            <p className="page-subtitle">
              Màn này được kéo về kiểu kể chuyện: nhìn rõ ai đã ghi lại khoảnh khắc đó, đọc theo cụm thời gian, và ưu tiên
              ảnh cùng cảm xúc hơn là metadata khô.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <RolePill role={role as AppRole} text={`Bạn đang ghi với vai trò ${ROLE_NAME[role as AppRole]}`} />
              <span className="chip bg-white/80 text-soft">Story flow thay cho timeline zigzag cũ</span>
            </div>

            <div className="mt-6">
              <button type="button" onClick={openCreateEditor} className="btn-primary">
                <Plus size={16} />
                Ghi kỷ niệm mới
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SummaryTile label="Tổng kỷ niệm" value={`${summary.total}`} hint="Tất cả những điều đã được giữ lại" />
            <SummaryTile label="Ni ghi lại" value={`${summary.girlfriend}`} hint="Những khoảnh khắc đến từ góc của Ni" />
            <SummaryTile label="Được ghi lại" value={`${summary.boyfriend}`} hint="Những khoảnh khắc đến từ góc của Được" />
          </div>
        </div>
      </section>

      <section className="surface-card p-5 md:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={36} />
          </div>
        ) : memories.length === 0 ? (
          <EmptyState
            icon={<NotebookPen size={18} />}
            title="Chưa có kỷ niệm nào được kể lại"
            description="Khi có ảnh hoặc một đoạn ngắn đầu tiên, timeline này sẽ bắt đầu có câu chuyện thay vì chỉ là chỗ trống."
            action={
              <button type="button" onClick={openCreateEditor} className="btn-primary">
                <Plus size={16} />
                Ghi kỷ niệm đầu tiên
              </button>
            }
          />
        ) : (
          <div className="space-y-8">
            {(Object.keys(groupedMemories) as Array<keyof typeof groupedMemories>)
              .filter(bucket => groupedMemories[bucket].length > 0)
              .map(bucket => (
                <section key={bucket}>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-px flex-1 bg-rose-100" />
                    <p className="section-label">{getTimelineBucketLabel(bucket)}</p>
                    <div className="h-px flex-1 bg-rose-100" />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {groupedMemories[bucket].map(memory => (
                      <article key={memory._id} className="overflow-hidden rounded-[1.6rem] bg-[#faf6f8]">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMemory(memory);
                            setShowDetail(true);
                          }}
                          className="block w-full text-left"
                        >
                          {memory.media?.[0] ? (
                            <div className="aspect-[16/10] overflow-hidden">
                              <img src={memory.media[0]} alt={memory.title} className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
                            </div>
                          ) : (
                            <div className="flex aspect-[16/10] items-center justify-center bg-gradient-to-br from-rose-100 to-white text-primary">
                              <Camera size={28} />
                            </div>
                          )}

                          <div className="p-4 md:p-5">
                            <div className="flex flex-wrap items-center gap-2">
                              <RolePill role={(memory.createdBy ?? 'girlfriend') as AppRole} text={`${ROLE_NAME[memory.createdBy ?? 'girlfriend']} ghi lại`} />
                              <span className="chip bg-white text-soft">{memory.mood}</span>
                              <span className="text-xs font-bold text-soft">{formatCompactDate(memory.date)}</span>
                            </div>

                            <h2 className="mt-3 text-xl font-black text-ink">{memory.title}</h2>
                            <p className="mt-2 line-clamp-3 text-sm leading-7 text-soft">{memory.content}</p>
                          </div>
                        </button>

                        {canManageMemory(memory) ? (
                          <div className="flex gap-2 border-t border-white/80 px-4 py-4">
                            <button type="button" onClick={() => openEditEditor(memory)} className="btn-secondary flex-1 justify-center py-3">
                              <Pencil size={16} />
                              Sửa
                            </button>
                            <button type="button" onClick={() => handleDeleteMemory(memory._id)} className="btn-secondary flex-1 justify-center py-3 text-rose-600">
                              <Trash2 size={16} />
                              Xoá
                            </button>
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </section>

      <SheetDialog
        open={showEditor}
        onClose={closeEditor}
        title={editingId ? 'Sửa lại kỷ niệm' : 'Ghi một kỷ niệm mới'}
        subtitle="Mỗi kỷ niệm được gắn rõ với người đang ghi để timeline luôn giữ đúng góc nhìn."
        headerSlot={<RolePill role={formData.createdBy} text={`${ROLE_NAME[formData.createdBy]} đang ghi lại`} />}
        footer={
          <div className="flex gap-3">
            <button type="button" onClick={closeEditor} className="btn-secondary flex-1 justify-center py-3">
              Để sau
            </button>
            <button type="submit" form="memory-editor-form" disabled={uploading} className="btn-primary flex-1 justify-center py-3">
              {uploading ? <Loader2 size={16} className="animate-spin" /> : <NotebookPen size={16} />}
              {editingId ? 'Cập nhật' : 'Lưu kỷ niệm'}
            </button>
          </div>
        }
      >
        <form id="memory-editor-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="relative overflow-hidden rounded-[1.5rem] border border-dashed border-rose-200 bg-[#faf6f8]">
            {previewUrl ? (
              <img src={previewUrl} alt="Xem trước" className="aspect-[16/10] h-full w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] flex-col items-center justify-center gap-3 text-soft">
                <Camera size={24} />
                <p className="text-sm font-bold">Chọn một ảnh nếu có</p>
              </div>
            )}
            <input type="file" accept="image/*" className="absolute inset-0 cursor-pointer opacity-0" onChange={handleFileSelect} />
          </div>

          <input
            required
            value={formData.title}
            onChange={event => setFormData(current => ({ ...current, title: event.target.value }))}
            className="form-input"
            placeholder="Tiêu đề cho khoảnh khắc này"
          />

          <input
            required
            type="date"
            value={formData.date}
            onChange={event => setFormData(current => ({ ...current, date: event.target.value }))}
            className="form-input"
          />

          <textarea
            required
            rows={5}
            value={formData.content}
            onChange={event => setFormData(current => ({ ...current, content: event.target.value }))}
            className="form-input min-h-[168px] resize-none"
            placeholder="Kể ngắn thôi, vừa đủ để lần sau mở lại còn thấy bầu không khí của hôm đó."
          />

          <div className="flex flex-wrap gap-2">
            {moodOptions.map(mood => (
              <button
                key={mood}
                type="button"
                onClick={() => setFormData(current => ({ ...current, mood }))}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  formData.mood === mood ? 'bg-primary text-white' : 'bg-[#faf6f8] text-soft'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </form>
      </SheetDialog>

      <SheetDialog
        open={showDetail}
        onClose={() => setShowDetail(false)}
        title={selectedMemory?.title ?? 'Chi tiết kỷ niệm'}
        subtitle={selectedMemory ? formatFullDate(selectedMemory.date) : ''}
        headerSlot={selectedMemory ? <RolePill role={(selectedMemory.createdBy ?? 'girlfriend') as AppRole} text={`${ROLE_NAME[selectedMemory.createdBy ?? 'girlfriend']} ghi lại`} /> : null}
        footer={
          selectedMemory && canManageMemory(selectedMemory) ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDetail(false);
                  openEditEditor(selectedMemory);
                }}
                className="btn-secondary flex-1 justify-center py-3"
              >
                <Pencil size={16} />
                Sửa kỷ niệm
              </button>
              <button type="button" onClick={() => handleDeleteMemory(selectedMemory._id)} className="btn-secondary flex-1 justify-center py-3 text-rose-600">
                <Trash2 size={16} />
                Xoá
              </button>
            </div>
          ) : null
        }
      >
        {selectedMemory ? (
          <div className="space-y-4">
            {selectedMemory.media?.[0] ? (
              <div className="overflow-hidden rounded-[1.5rem]">
                <img src={selectedMemory.media[0]} alt={selectedMemory.title} className="aspect-[16/10] h-full w-full object-cover" />
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-2">
              <span className="chip bg-rose-50 text-primary">{selectedMemory.mood}</span>
              <span className="chip bg-white text-soft">
                <CalendarDays size={14} />
                {formatCompactDate(selectedMemory.date)}
              </span>
            </div>

            <p className="text-sm leading-7 text-soft">{selectedMemory.content}</p>
          </div>
        ) : null}
      </SheetDialog>
    </div>
  );
};

const SummaryTile: React.FC<{ label: string; value: string; hint: string }> = ({ label, value, hint }) => (
  <div className="rounded-[1.4rem] bg-white/84 p-4 shadow-sm ring-1 ring-black/5">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b292a6]">{label}</p>
    <p className="mt-2 text-xl font-black text-ink">{value}</p>
    <p className="mt-1 text-sm text-soft">{hint}</p>
  </div>
);

export default TimelineV2;
