import React, { useState, useEffect } from 'react';
import { adminApi, type AdminTestSeries } from './api';
import { useAdminToast } from './AdminToast';

interface TestSeriesManagerProps {
  currentUserRole?: string;
  onSelectSeriesForHierarchy?: (series: AdminTestSeries) => void;
  onSelectSeriesForTests?: (series: AdminTestSeries) => void;
}

const CATEGORIES = [
  'central-government',
  'state-exams',
  'banking',
  'ssc-railways',
  'teaching',
  'defence',
  'others',
];

export function TestSeriesManager({
  currentUserRole,
  onSelectSeriesForHierarchy,
  onSelectSeriesForTests,
}: TestSeriesManagerProps) {
  const { showToast } = useAdminToast();
  const [seriesList, setSeriesList] = useState<AdminTestSeries[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSeries, setEditingSeries] = useState<AdminTestSeries | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [targetExam, setTargetExam] = useState('');
  const [category, setCategory] = useState('ssc-railways');
  const [organization, setOrganization] = useState('');
  const [description, setDescription] = useState('');
  const [accessType, setAccessType] = useState<'free' | 'premium' | 'freemium'>('free');
  const [badge, setBadge] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [order, setOrder] = useState(0);

  const isAdmin = currentUserRole === 'admin';

  const fetchSeries = async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getTestSeries();
      setSeriesList(data || []);
    } catch (err: any) {
      showToast(err.message || 'Failed to load test series', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSeries();
  }, []);

  const openCreateModal = () => {
    setEditingSeries(null);
    setTitle('');
    setSlug('');
    setTargetExam('');
    setCategory('ssc-railways');
    setOrganization('');
    setDescription('');
    setAccessType('free');
    setBadge('');
    setLogoUrl('');
    setOrder(0);
    setIsModalOpen(true);
  };

  const openEditModal = (s: AdminTestSeries) => {
    setEditingSeries(s);
    setTitle(s.title);
    setSlug(s.slug);
    setTargetExam(s.targetExam);
    setCategory(s.category);
    setOrganization(s.organization || '');
    setDescription(s.description || '');
    setAccessType(s.accessType || 'free');
    setBadge(s.badge || '');
    setLogoUrl(s.logoUrl || '');
    setOrder(s.order || 0);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingSeries) {
      const autoSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(autoSlug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim() || !targetExam.trim()) {
      showToast('Title, slug, and target exam are required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const payload: Partial<AdminTestSeries> = {
        title: title.trim(),
        slug: slug.trim(),
        targetExam: targetExam.trim(),
        category,
        organization: organization.trim() || null,
        description: description.trim() || null,
        accessType,
        badge: badge.trim() || null,
        logoUrl: logoUrl.trim() || null,
        order: Number(order) || 0,
        supportedLanguages: ['Hindi', 'English'],
      };

      if (editingSeries) {
        await adminApi.updateTestSeries(editingSeries.id || editingSeries._id!, payload);
        showToast('Test series updated successfully.', 'success');
      } else {
        await adminApi.createTestSeries(payload);
        showToast('Test series created in draft status.', 'success');
      }
      setIsModalOpen(false);
      fetchSeries();
    } catch (err: any) {
      showToast(err.message || 'Failed to save test series.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (s: AdminTestSeries, newStatus: 'draft' | 'published' | 'archived') => {
    if (!isAdmin) {
      showToast('Administrator privileges are required to change publication status.', 'error');
      return;
    }
    try {
      await adminApi.updateTestSeriesStatus(s.id || s._id!, newStatus);
      showToast(`Test series status updated to ${newStatus}.`, 'success');
      fetchSeries();
    } catch (err: any) {
      showToast(err.message || 'Status update failed.', 'error');
    }
  };

  const handleDelete = async (s: AdminTestSeries) => {
    if (!isAdmin) {
      showToast('Administrator privileges are required for destructive deletion.', 'error');
      return;
    }
    if (!confirm(`Are you sure you want to delete "${s.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await adminApi.deleteTestSeries(s.id || s._id!);
      showToast('Test series deleted.', 'success');
      fetchSeries();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete test series.', 'error');
    }
  };

  const filtered = seriesList.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.targetExam.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-zinc-100">
            Test Series Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
            Manage target exams, test series suites, categories, and exam metadata.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-2xs transition cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Test Series</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <svg
            className="w-4 h-4 text-slate-400 dark:text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by series title, exam, or organization..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 dark:text-zinc-100"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-600 dark:text-zinc-100"
        >
          <option value="ALL">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace('-', ' ').toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Table of Test Series */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-zinc-400">
            <span className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin inline-block mb-2" />
            <p>Loading Test Series...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-zinc-400 space-y-2">
            <p className="text-sm font-semibold">No Test Series found</p>
            <p className="text-xs">Create your first Test Series or change search filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-zinc-800/50 border-b border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Series & Target Exam</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Access Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/80">
                {filtered.map((s) => (
                  <tr key={s.id || s._id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-zinc-100">
                        {s.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-zinc-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-blue-600 dark:text-blue-400">{s.targetExam}</span>
                        {s.organization && <span>• {s.organization}</span>}
                        {s.badge && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-semibold">
                            {s.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize text-slate-600 dark:text-zinc-300">
                      {s.category.replace('-', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          s.accessType === 'free'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                        }`}
                      >
                        {s.accessType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin ? (
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s, e.target.value as any)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:outline-hidden ${
                            s.status === 'published'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : s.status === 'draft'
                              ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                            s.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                          }`}
                        >
                          {s.status}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                      {s.order ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {onSelectSeriesForHierarchy && (
                          <button
                            type="button"
                            onClick={() => onSelectSeriesForHierarchy(s)}
                            className="px-2.5 py-1 text-slate-700 dark:text-zinc-300 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-lg text-[11px] font-medium transition cursor-pointer"
                            title="Manage Subjects and Chapters"
                          >
                            Subjects & Chapters
                          </button>
                        )}
                        {onSelectSeriesForTests && (
                          <button
                            type="button"
                            onClick={() => onSelectSeriesForTests(s)}
                            className="px-2.5 py-1 text-blue-700 dark:text-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 rounded-lg text-[11px] font-semibold transition cursor-pointer"
                            title="Configure Tests"
                          >
                            Test Builder
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditModal(s)}
                          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 rounded-md transition cursor-pointer"
                          title="Edit Settings"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleDelete(s)}
                            className="p-1 text-rose-500 hover:text-rose-700 rounded-md transition cursor-pointer"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingSeries ? 'Edit Test Series' : 'Create New Test Series'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Series Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. RRB NTPC Graduate Level 2026 Test Series"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="rrb-ntpc-2026"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Target Exam *
                  </label>
                  <input
                    type="text"
                    required
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="e.g. RRB NTPC"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('-', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Railway Recruitment Board"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Access Tier
                  </label>
                  <select
                    value={accessType}
                    onChange={(e) => setAccessType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  >
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                    <option value="freemium">Freemium</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Badge
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="e.g. Popular, New"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                    Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive mock tests with detailed solutions according to latest exam pattern..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl dark:text-zinc-100 focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingSeries ? 'Update Series' : 'Create Series'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
