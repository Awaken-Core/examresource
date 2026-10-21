import React, { useState, useEffect } from 'react';
import {
  adminApi,
  type AdminTestSeries,
  type AdminSubject,
  type AdminTestSeriesSubject,
  type AdminChapter,
} from './api';
import { useAdminToast } from './AdminToast';

interface HierarchyManagerProps {
  initialSeriesId?: string;
  onNavigateToTests?: (series: AdminTestSeries) => void;
}

export function HierarchyManager({
  initialSeriesId,
  onNavigateToTests,
}: HierarchyManagerProps) {
  const { showToast } = useAdminToast();

  const [seriesList, setSeriesList] = useState<AdminTestSeries[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(initialSeriesId || '');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');

  // Global Subjects
  const [globalSubjects, setGlobalSubjects] = useState<AdminSubject[]>([]);
  const [seriesSubjects, setSeriesSubjects] = useState<AdminTestSeriesSubject[]>([]);
  const [chapters, setChapters] = useState<AdminChapter[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isAssignSubjectOpen, setIsAssignSubjectOpen] = useState(false);
  const [isCreateGlobalSubjectOpen, setIsCreateGlobalSubjectOpen] = useState(false);
  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<AdminChapter | null>(null);

  // Form states
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectSlug, setNewSubjectSlug] = useState('');
  const [assignSubjectId, setAssignSubjectId] = useState('');
  const [assignCustomName, setAssignCustomName] = useState('');
  const [assignOrder, setAssignOrder] = useState(0);

  const [chapterName, setChapterName] = useState('');
  const [chapterSlug, setChapterSlug] = useState('');
  const [chapterOrder, setChapterOrder] = useState(0);
  const [chapterStatus, setChapterStatus] = useState<'draft' | 'published' | 'archived'>('published');
  const [chapterDescription, setChapterDescription] = useState('');

  // Load series & global subjects
  useEffect(() => {
    async function loadInitial() {
      try {
        const [sList, subs] = await Promise.all([
          adminApi.getTestSeries(),
          adminApi.getSubjects(),
        ]);
        setSeriesList(sList || []);
        setGlobalSubjects(subs || []);
        if (!selectedSeriesId && sList && sList.length > 0) {
          setSelectedSeriesId(sList[0].id || sList[0]._id!);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load initial data', 'error');
      }
    }
    loadInitial();
  }, []);

  // When series selection changes, load assigned subjects
  const fetchSeriesSubjects = async (sId: string) => {
    if (!sId) return;
    setIsLoading(true);
    try {
      const data = await adminApi.getSeriesSubjects(sId);
      setSeriesSubjects(data || []);
      if (data && data.length > 0) {
        setSelectedSubjectId(data[0].subjectId);
      } else {
        setSelectedSubjectId('');
        setChapters([]);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load assigned subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSeriesId) {
      fetchSeriesSubjects(selectedSeriesId);
    }
  }, [selectedSeriesId]);

  // When selected subject changes, load chapters
  const fetchChapters = async (sId: string, subId: string) => {
    if (!sId || !subId) return;
    try {
      const data = await adminApi.getSeriesChapters(sId, subId);
      setChapters(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load chapters', 'error');
    }
  };

  useEffect(() => {
    if (selectedSeriesId && selectedSubjectId) {
      fetchChapters(selectedSeriesId, selectedSubjectId);
    } else {
      setChapters([]);
    }
  }, [selectedSeriesId, selectedSubjectId]);

  // Actions: Global Subject Create
  const handleCreateGlobalSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim() || !newSubjectSlug.trim()) return;
    try {
      const created = await adminApi.createSubject({
        name: newSubjectName.trim(),
        slug: newSubjectSlug.trim(),
      });
      showToast('Global Subject created.', 'success');
      setGlobalSubjects((prev) => [...prev, created]);
      setAssignSubjectId(created.id || created._id!);
      setIsCreateGlobalSubjectOpen(false);
      setNewSubjectName('');
      setNewSubjectSlug('');
    } catch (err: any) {
      showToast(err.message || 'Failed to create subject', 'error');
    }
  };

  // Actions: Assign Subject to Series
  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignSubjectId || !selectedSeriesId) return;
    try {
      await adminApi.assignSubjectToSeries(selectedSeriesId, {
        subjectId: assignSubjectId,
        customDisplayName: assignCustomName.trim() || null,
        order: Number(assignOrder) || 0,
      });
      showToast('Subject assigned to Test Series.', 'success');
      setIsAssignSubjectOpen(false);
      setAssignSubjectId('');
      setAssignCustomName('');
      fetchSeriesSubjects(selectedSeriesId);
    } catch (err: any) {
      showToast(err.message || 'Failed to assign subject', 'error');
    }
  };

  const handleRemoveSubject = async (subjectId: string) => {
    if (!confirm('Unassign this subject from this Test Series? Existing question mappings and chapters for this series will be affected.')) {
      return;
    }
    try {
      await adminApi.removeSubjectFromSeries(selectedSeriesId, subjectId);
      showToast('Subject unassigned from Test Series.', 'success');
      fetchSeriesSubjects(selectedSeriesId);
    } catch (err: any) {
      showToast(err.message || 'Failed to unassign subject', 'error');
    }
  };

  // Actions: Chapter Create / Edit
  const openCreateChapter = () => {
    setEditingChapter(null);
    setChapterName('');
    setChapterSlug('');
    setChapterOrder(chapters.length);
    setChapterStatus('published');
    setChapterDescription('');
    setIsChapterModalOpen(true);
  };

  const openEditChapter = (c: AdminChapter) => {
    setEditingChapter(c);
    setChapterName(c.name);
    setChapterSlug(c.slug);
    setChapterOrder(c.order ?? 0);
    setChapterStatus(c.status);
    setChapterDescription(c.description || '');
    setIsChapterModalOpen(true);
  };

  const handleChapterNameChange = (val: string) => {
    setChapterName(val);
    if (!editingChapter) {
      setChapterSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, ''),
      );
    }
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterName.trim() || !chapterSlug.trim() || !selectedSubjectId || !selectedSeriesId) return;

    try {
      if (editingChapter) {
        await adminApi.updateChapter(editingChapter.id || editingChapter._id!, {
          name: chapterName.trim(),
          slug: chapterSlug.trim(),
          order: Number(chapterOrder) || 0,
          status: chapterStatus,
          description: chapterDescription.trim() || null,
        });
        showToast('Chapter updated.', 'success');
      } else {
        await adminApi.createChapter(selectedSeriesId, {
          name: chapterName.trim(),
          slug: chapterSlug.trim(),
          subjectId: selectedSubjectId,
          order: Number(chapterOrder) || 0,
          status: chapterStatus,
          description: chapterDescription.trim() || null,
        });
        showToast('Chapter created.', 'success');
      }
      setIsChapterModalOpen(false);
      fetchChapters(selectedSeriesId, selectedSubjectId);
    } catch (err: any) {
      showToast(err.message || 'Failed to save chapter', 'error');
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Delete this chapter? This operation fails if tests are linked to it.')) return;
    try {
      await adminApi.deleteChapter(chapterId);
      showToast('Chapter deleted.', 'success');
      fetchChapters(selectedSeriesId, selectedSubjectId);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete chapter', 'error');
    }
  };

  const selectedSeries = seriesList.find((s) => (s.id || s._id) === selectedSeriesId);
  const selectedSubject = seriesSubjects.find((s) => s.subjectId === selectedSubjectId);

  return (
    <div className="space-y-5">
      {/* Breadcrumb & Series Selector Header */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
              <span className="text-blue-600 dark:text-blue-400 font-bold">Hierarchy</span>
              <span>›</span>
              <span>{selectedSeries?.title || 'Select Series'}</span>
              {selectedSubject && (
                <>
                  <span>›</span>
                  <span className="font-semibold text-slate-800 dark:text-zinc-200">
                    {selectedSubject.customDisplayName || selectedSubject.subject?.name}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100 mt-1">
              Test Series Hierarchy: Subjects & Chapters
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {selectedSeries && onNavigateToTests && (
              <button
                type="button"
                onClick={() => onNavigateToTests(selectedSeries)}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded-xl border border-blue-200 dark:border-blue-900/60 transition cursor-pointer"
              >
                Go to Test Builder ↗
              </button>
            )}
          </div>
        </div>

        {/* Series Selector Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100 dark:border-zinc-800">
          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 shrink-0">
            Target Test Series:
          </label>
          <select
            value={selectedSeriesId}
            onChange={(e) => setSelectedSeriesId(e.target.value)}
            className="w-full sm:w-80 px-3 py-2 text-xs bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-600 dark:text-zinc-100"
          >
            {seriesList.map((s) => (
              <option key={s.id || s._id} value={s.id || s._id}>
                {s.title} ({s.targetExam})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Two Column Layout: Left Subjects, Right Chapters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Assigned Subjects (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  Assigned Subjects ({seriesSubjects.length})
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  Shared across test series suites
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignSubjectOpen(true)}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition cursor-pointer"
              >
                + Assign Subject
              </button>
            </div>

            <div className="p-2 divide-y divide-slate-100 dark:divide-zinc-800">
              {isLoading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading subjects...</div>
              ) : seriesSubjects.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  No subjects assigned to this Test Series yet. Click &quot;+ Assign Subject&quot; above.
                </div>
              ) : (
                seriesSubjects.map((sub) => {
                  const isSelected = sub.subjectId === selectedSubjectId;
                  return (
                    <div
                      key={sub.id || sub._id}
                      onClick={() => setSelectedSubjectId(sub.subjectId)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60'
                          : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                          }`}
                        >
                          {sub.order ?? 0}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {sub.customDisplayName || sub.subject?.name}
                          </div>
                          {sub.customDisplayName && (
                            <div className="text-[10px] text-slate-400">
                              Global: {sub.subject?.name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSubject(sub.subjectId);
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                          title="Unassign Subject"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Chapters for selected subject (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
            <div className="p-3.5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/40">
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">
                  Exam-Specific Chapters ({chapters.length})
                </h2>
                <p className="text-[10px] text-slate-500 dark:text-zinc-400">
                  {selectedSubject
                    ? `For ${selectedSubject.customDisplayName || selectedSubject.subject?.name} in ${selectedSeries?.targetExam}`
                    : 'Select a subject from the left panel'}
                </p>
              </div>

              {selectedSubjectId && (
                <button
                  type="button"
                  onClick={openCreateChapter}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold rounded-lg shadow-2xs transition cursor-pointer"
                >
                  + Add Chapter
                </button>
              )}
            </div>

            <div className="p-3">
              {!selectedSubjectId ? (
                <div className="p-10 text-center text-slate-400 text-xs">
                  Please select a subject from the left panel to manage its exam-specific chapters.
                </div>
              ) : chapters.length === 0 ? (
                <div className="p-10 text-center text-slate-400 text-xs space-y-2">
                  <p>No chapters created for this subject in this Test Series.</p>
                  <button
                    type="button"
                    onClick={openCreateChapter}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-semibold text-xs rounded-xl hover:bg-blue-100 cursor-pointer"
                  >
                    Create First Chapter
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((chap) => (
                    <div
                      key={chap.id || chap._id}
                      className="p-3 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-slate-400 font-bold">
                          #{chap.order ?? 0}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {chap.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {chap.slug}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            chap.status === 'published'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          {chap.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditChapter(chap)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteChapter(chap.id || chap._id!)}
                          className="p-1 text-rose-500 hover:text-rose-700 rounded cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Subject Modal */}
      {isAssignSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Assign Subject to {selectedSeries?.title}
              </h2>
              <button
                type="button"
                onClick={() => setIsAssignSubjectOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignSubject} className="space-y-3 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium text-slate-700 dark:text-zinc-300">
                    Select Global Subject *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAssignSubjectOpen(false);
                      setIsCreateGlobalSubjectOpen(true);
                    }}
                    className="text-blue-600 dark:text-blue-400 hover:underline text-[11px] font-semibold"
                  >
                    + Create New Subject
                  </button>
                </div>
                <select
                  required
                  value={assignSubjectId}
                  onChange={(e) => setAssignSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                >
                  <option value="">-- Choose Subject --</option>
                  {globalSubjects.map((s) => (
                    <option key={s.id || s._id} value={s.id || s._id}>
                      {s.name} ({s.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Custom Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={assignCustomName}
                  onChange={(e) => setAssignCustomName(e.target.value)}
                  placeholder="e.g. Quantitative Aptitude"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  value={assignOrder}
                  onChange={(e) => setAssignOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAssignSubjectOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Assign Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Global Subject Modal */}
      {isCreateGlobalSubjectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Create New Global Subject
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateGlobalSubjectOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateGlobalSubject} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => {
                    setNewSubjectName(e.target.value);
                    setNewSubjectSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/^-|-$/g, ''),
                    );
                  }}
                  placeholder="e.g. Mathematics"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={newSubjectSlug}
                  onChange={(e) => setNewSubjectSlug(e.target.value)}
                  placeholder="mathematics"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateGlobalSubjectOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Chapter Modal */}
      {isChapterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingChapter ? 'Edit Chapter' : 'Add Chapter'}
              </h2>
              <button
                type="button"
                onClick={() => setIsChapterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChapter} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Chapter Name *
                </label>
                <input
                  type="text"
                  required
                  value={chapterName}
                  onChange={(e) => handleChapterNameChange(e.target.value)}
                  placeholder="e.g. Percentage & Applications"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={chapterSlug}
                  onChange={(e) => setChapterSlug(e.target.value)}
                  placeholder="percentage-applications"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={chapterOrder}
                    onChange={(e) => setChapterOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={chapterStatus}
                    onChange={(e) => setChapterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Description / Topic Notes
                </label>
                <textarea
                  rows={2}
                  value={chapterDescription}
                  onChange={(e) => setChapterDescription(e.target.value)}
                  placeholder="Includes profit & loss, discounts, and ratio conversions..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsChapterModalOpen(false)}
                  className="px-3 py-1.5 border border-slate-300 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl cursor-pointer"
                >
                  Save Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
