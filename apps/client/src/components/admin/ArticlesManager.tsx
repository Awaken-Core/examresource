import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi, type Post, type Category } from './api';
import { useAdminToast } from './AdminToast';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { AssignCategoriesModal } from './AssignCategoriesModal';

interface ArticlesManagerProps {
  categories: Category[];
  onOpenCreateCategory: () => void;
  onRefreshCategories: () => void;
}

export function ArticlesManager({
  categories,
  onOpenCreateCategory,
  onRefreshCategories,
}: ArticlesManagerProps) {
  const { showToast } = useAdminToast();

  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [page, setPage] = useState(0);
  const limit = 20;

  // Modals state
  const [deleteTarget, setDeleteTarget] = useState<Post | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Post | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch articles
  const fetchArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminApi.getArticles({
        search: debouncedSearch.trim() || undefined,
        status: selectedStatus,
        categoryId: selectedCategory,
        limit,
        offset: page * limit,
      });
      setPosts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load articles from the server.');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedStatus, selectedCategory, page]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedStatus, selectedCategory]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  // Status stats calculated from current articles
  const stats = useMemo(() => {
    let pub = 0;
    let drf = 0;
    let sch = 0;
    posts.forEach((p) => {
      if (p.status === 'PUBLISHED') pub++;
      else if (p.status === 'DRAFT') drf++;
      else if (p.status === 'SCHEDULED') sch++;
    });
    return {
      total: posts.length,
      published: pub,
      drafts: drf,
      scheduled: sch,
    };
  }, [posts]);

  // Handle single category change from table dropdown
  const handlePrimaryCategoryChange = async (postId: string, newCategoryId: string) => {
    try {
      await adminApi.updateArticle(postId, {
        categoryId: newCategoryId || null,
        categoryIds: newCategoryId ? [newCategoryId] : [],
      });
      const catObj = categories.find((c) => c.id === newCategoryId);
      showToast(`Category updated to "${catObj ? catObj.name : 'Uncategorized'}".`);
      fetchArticles();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update category', 'error');
    }
  };

  // Toggle publish / unpublish status with optimistic UI update
  const handleToggleStatus = async (post: Post) => {
    const nextStatus = post.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    
    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, status: nextStatus } : p))
    );

    try {
      await adminApi.updateArticle(post.id, { status: nextStatus });
      showToast(`Article marked as ${nextStatus}.`);
    } catch (err: any) {
      // Revert on failure
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, status: post.status } : p))
      );
      showToast(err?.message || 'Failed to update status', 'error');
    }
  };

  // Delete article confirmation
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteArticle(deleteTarget.id);
      showToast('Article permanently deleted.');
      setDeleteTarget(null);
      fetchArticles();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete article', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Save multi-categories
  const handleSaveCategories = async (postId: string, categoryIds: string[]) => {
    setIsAssigning(true);
    try {
      await adminApi.updateArticle(postId, {
        categoryIds,
        categoryId: categoryIds[0] || null,
      });
      showToast('Categories updated successfully.');
      fetchArticles();
      onRefreshCategories();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update categories', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              Content Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Organize topics into blog categories (Java, Civil Engineering, Government Jobs) and write articles inside them.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenCreateCategory}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700/60 text-slate-800 dark:text-zinc-200 font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Create Category</span>
            </button>

            <a
              href="/editor"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition cursor-pointer"
              style={{ backgroundColor: '#2563EB' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Write an Article</span>
            </a>
          </div>
        </div>

        {/* Stats Pill Ribbon */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setSelectedStatus('ALL'); setPage(0); }}
            className={`inline-flex items-center gap-1.5 transition cursor-pointer ${
              selectedStatus === 'ALL' ? 'text-slate-900 dark:text-white font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <span className="text-slate-400 dark:text-zinc-500">Articles:</span>
            <span className="font-semibold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
              {stats.total}
            </span>
          </button>

          <span className="text-slate-200 dark:text-zinc-800">|</span>

          <button
            type="button"
            onClick={() => { setSelectedStatus('PUBLISHED'); setPage(0); }}
            className={`inline-flex items-center gap-1.5 transition cursor-pointer ${
              selectedStatus === 'PUBLISHED' ? 'text-emerald-700 dark:text-emerald-300 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>Published:</span>
            <span className="font-semibold px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
              {stats.published}
            </span>
          </button>

          <span className="text-slate-200 dark:text-zinc-800">|</span>

          <button
            type="button"
            onClick={() => { setSelectedStatus('DRAFT'); setPage(0); }}
            className={`inline-flex items-center gap-1.5 transition cursor-pointer ${
              selectedStatus === 'DRAFT' ? 'text-amber-700 dark:text-amber-300 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
            <span>Drafts:</span>
            <span className="font-semibold px-1.5 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
              {stats.drafts}
            </span>
          </button>

          <span className="text-slate-200 dark:text-zinc-800">|</span>

          <button
            type="button"
            onClick={() => { setSelectedStatus('SCHEDULED'); setPage(0); }}
            className={`inline-flex items-center gap-1.5 transition cursor-pointer ${
              selectedStatus === 'SCHEDULED' ? 'text-purple-700 dark:text-purple-300 font-bold' : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
            }`}
          >
            <span className="inline-block w-2 h-2 rounded-full bg-purple-400" />
            <span>Scheduled:</span>
            <span className="font-semibold px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300">
              {stats.scheduled}
            </span>
          </button>
        </div>
      </div>

      {/* Error state with retry */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs text-rose-800 dark:text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchArticles}
            className="px-3 py-1 bg-rose-100 dark:bg-rose-900/40 hover:bg-rose-200 text-rose-800 dark:text-rose-200 font-semibold rounded-lg text-xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Articles Toolbar: Search & Category Filter & Tabs */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Articles
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search title, slug..."
                className="w-48 sm:w-60 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
              <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2 top-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Category Select Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 dark:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-1.5 flex items-center gap-1 overflow-x-auto text-xs shadow-2xs">
          {[
            { id: 'ALL', label: 'All Articles' },
            { id: 'PUBLISHED', label: 'Published' },
            { id: 'DRAFT', label: 'Drafts' },
            { id: 'SCHEDULED', label: 'Scheduled' },
            { id: 'ARCHIVED', label: 'Archived' },
          ].map((tab) => {
            const active = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => { setSelectedStatus(tab.id); setPage(0); }}
                className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-zinc-800/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Articles Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-100 dark:divide-zinc-800">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Article Title</th>
                <th className="py-3 px-3">Blog Category</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Last Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded w-52" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-24" /></td>
                    <td className="py-3.5 px-3"><div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-full w-16" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-20" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg className="w-8 h-8 text-slate-300 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <p>No articles found.</p>
                      <a
                        href="/editor"
                        className="mt-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                      >
                        Write your first article →
                      </a>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const primaryCatId = post.categoryId || post.category?.id || '';
                  const attachedCategories =
                    Array.isArray(post.categories) && post.categories.length > 0
                      ? post.categories
                      : post.category
                      ? [post.category]
                      : [];
                  const extraCount = attachedCategories.length > 1 ? attachedCategories.length - 1 : 0;
                  const publicUrl = `/${post.slug}`;

                  const statusClass =
                    post.status === 'PUBLISHED'
                      ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                      : post.status === 'SCHEDULED'
                      ? 'text-purple-700 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-900/60'
                      : post.status === 'ARCHIVED'
                      ? 'text-slate-600 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 border-slate-200 dark:border-zinc-700'
                      : 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';

                  const dateStr = post.updatedAt
                    ? new Date(post.updatedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  const languageChips = post.languages || [
                    { language: post.language || 'HINGLISH', id: post.id },
                  ];

                  return (
                    <tr
                      key={post.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      {/* Title & languages */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <a
                          href={`/editor?edit=${post.id}`}
                          className="font-semibold text-slate-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 transition block truncate"
                        >
                          {post.title || 'Untitled Article'}
                        </a>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
                            {publicUrl}
                          </span>
                          <span className="inline-flex items-center gap-1 shrink-0">
                            {languageChips.map((l) => (
                              <a
                                key={l.id}
                                href={`/editor?edit=${l.id}`}
                                title={`Edit ${l.language === 'ENGLISH' ? 'English' : 'Hinglish'} draft`}
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold transition hover:opacity-80 ${
                                  l.language === 'ENGLISH'
                                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60'
                                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60'
                                }`}
                              >
                                {l.language === 'ENGLISH' ? '🌐 EN' : '🇮🇳 HI'}
                              </a>
                            ))}
                          </span>
                        </div>
                      </td>

                      {/* Category selector & multiple categories button */}
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 min-w-[150px]">
                          <select
                            value={primaryCatId}
                            onChange={(e) => handlePrimaryCategoryChange(post.id, e.target.value)}
                            title="Change Primary Category"
                            className="text-[11px] bg-slate-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700/60 focus:bg-white dark:focus:bg-zinc-800 border border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600 focus:border-blue-500 rounded-md px-2 py-1 text-slate-700 dark:text-zinc-300 font-medium transition outline-none cursor-pointer"
                          >
                            <option value="">-- No Category --</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {extraCount > 0 && (
                              <span
                                className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                                title={attachedCategories.map((c) => c.name).join(', ')}
                              >
                                +{extraCount} more
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setAssignTarget(post)}
                              className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                              title="Assign to multiple categories"
                            >
                              <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                              </svg>
                              Categories ({attachedCategories.length})
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${statusClass}`}>
                          {post.status}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-400 dark:text-zinc-500 font-mono text-[11px]">
                        {dateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <a
                          href={`/editor?edit=${post.id}`}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-semibold transition text-[11px]"
                        >
                          Edit
                        </a>
                        <a
                          href={publicUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-[11px]"
                        >
                          Preview ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(post)}
                          className="px-2 py-1 rounded-md text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-[11px] cursor-pointer"
                        >
                          {post.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(post)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition inline-flex items-center justify-center cursor-pointer align-middle"
                          title="Delete Article"
                          aria-label="Delete Article"
                        >
                          <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-800/40 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span>
            Showing {posts.length} articles {page > 0 ? `(Page ${page + 1})` : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={posts.length < limit}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Article"
        targetName={deleteTarget?.title || 'Article'}
        warning="Are you sure you want to permanently delete this article? This action cannot be undone."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Multi-Category Assignment Modal */}
      <AssignCategoriesModal
        isOpen={Boolean(assignTarget)}
        post={assignTarget}
        categories={categories}
        isLoading={isAssigning}
        onSave={handleSaveCategories}
        onClose={() => setAssignTarget(null)}
      />
    </div>
  );
}
