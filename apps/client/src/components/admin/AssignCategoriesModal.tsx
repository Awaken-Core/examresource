import React, { useState, useEffect } from 'react';
import type { Post, Category } from './api';

interface AssignCategoriesModalProps {
  isOpen: boolean;
  post: Post | null;
  categories: Category[];
  isLoading?: boolean;
  onSave: (postId: string, categoryIds: string[]) => Promise<void>;
  onClose: () => void;
}

export function AssignCategoriesModal({
  isOpen,
  post,
  categories,
  isLoading = false,
  onSave,
  onClose,
}: AssignCategoriesModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (post) {
      const set = new Set<string>();
      if (post.categoryId) set.add(post.categoryId);
      if (Array.isArray(post.categories)) {
        post.categories.forEach((c) => {
          if (c?.id) set.add(c.id);
        });
      }
      setSelectedIds(Array.from(set));
    } else {
      setSelectedIds([]);
    }
    setSearch('');
  }, [post, isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !post) return null;

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(search.toLowerCase()) ||
    cat.slug.toLowerCase().includes(search.toLowerCase())
  );

  const toggleCategory = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(categories.map((c) => c.id));
  };

  const handleClearAll = () => {
    setSelectedIds([]);
  };

  const handleSave = async () => {
    await onSave(post.id, selectedIds);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div className="min-w-0 pr-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span>Assign Categories</span>
            </h3>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 mt-1 line-clamp-1 break-words">
              {post.title}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 font-bold p-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2.5">
          {/* Quick search input */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter categories..."
              className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
            />
            <svg className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 absolute left-2.5 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
            <span>Selected ({selectedIds.length}):</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-blue-600 dark:text-blue-400 hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300 dark:text-zinc-700">|</span>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-slate-500 dark:text-zinc-400 hover:underline font-semibold text-[11px] cursor-pointer"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 border border-slate-200 dark:border-zinc-800 rounded-xl p-1 bg-slate-50/50 dark:bg-zinc-900/50">
            {categories.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 dark:text-zinc-500 text-center">
                No categories exist yet. Create a category in the Categories section first.
              </p>
            ) : filteredCategories.length === 0 ? (
              <p className="p-4 text-xs text-slate-400 dark:text-zinc-500 text-center">
                No matching categories found.
              </p>
            ) : (
              filteredCategories.map((cat) => {
                const isChecked = selectedIds.includes(cat.id);
                return (
                  <label
                    key={cat.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white dark:hover:bg-zinc-800 cursor-pointer transition select-none"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(cat.id)}
                      className="mt-0.5 rounded border-slate-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                          {cat.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500 shrink-0">
                          /blog/{cat.slug}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-[11px] text-slate-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-3.5 py-2 border border-slate-200 dark:border-zinc-700 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Save Categories</span>
          </button>
        </div>
      </div>
    </div>
  );
}
