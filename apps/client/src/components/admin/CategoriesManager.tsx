import React, { useState } from 'react';
import { adminApi, type Category } from './api';
import { useAdminToast } from './AdminToast';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { CategoryModal } from './CategoryModal';

interface CategoriesManagerProps {
  categories: Category[];
  isLoading: boolean;
  onRefresh: () => void;
  onOpenCreate: () => void;
  isCreateOpen: boolean;
  onCloseCreate: () => void;
}

export function CategoriesManager({
  categories,
  isLoading,
  onRefresh,
  onOpenCreate,
  isCreateOpen,
  onCloseCreate,
}: CategoriesManagerProps) {
  const { showToast } = useAdminToast();

  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle Save (Create or Edit)
  const handleSaveCategory = async (data: { name: string; slug: string; description?: string | null }) => {
    setIsSaving(true);
    try {
      if (editCategory) {
        await adminApi.updateCategory(editCategory.id, data);
        showToast(`Category "${data.name}" updated successfully.`);
        setEditCategory(null);
      } else {
        await adminApi.createCategory(data);
        showToast(`Category "${data.name}" created successfully.`);
        onCloseCreate();
      }
      onRefresh();
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteCategory) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteCategory(deleteCategory.id);
      showToast(`Category "${deleteCategory.name}" deleted.`);
      setDeleteCategory(null);
      onRefresh();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete category', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            Blog Categories
          </h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            A Blog Category represents an exam, subject, or syllabus stream (e.g. Java, Civil Engineering, SSC GD).
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 dark:bg-zinc-100 hover:bg-slate-800 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-semibold shadow-xs transition self-start sm:self-auto cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Category</span>
        </button>
      </div>

      {/* Categories Table */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-100 dark:divide-zinc-800">
            <thead className="bg-slate-50 dark:bg-zinc-800/60 text-slate-500 dark:text-zinc-400 font-semibold border-b border-slate-200 dark:border-zinc-800">
              <tr>
                <th className="py-3 px-4">Category Name</th>
                <th className="py-3 px-3">URL Slug</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Articles</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="h-3.5 bg-slate-100 dark:bg-zinc-800 rounded w-40" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-28" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-52" /></td>
                    <td className="py-3.5 px-3"><div className="h-3 bg-slate-100 dark:bg-zinc-800 rounded w-10" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="h-5 bg-slate-100 dark:bg-zinc-800 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs">
                    No categories created yet. Click "Create Category" to get started.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => {
                  const articleCount = cat.postCount ?? cat._count?.blogs ?? 0;
                  return (
                    <tr
                      key={cat.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/40 transition"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-100">
                        {cat.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-slate-500 dark:text-zinc-400">
                        /blog/{cat.slug}
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-zinc-400 text-xs max-w-xs truncate">
                        {cat.description || '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-300 text-xs">
                        {articleCount}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => setEditCategory(cat)}
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium transition text-[11px] cursor-pointer"
                        >
                          Edit
                        </button>
                        <a
                          href={`/blog/${cat.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded-md border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition text-[11px]"
                        >
                          View ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => setDeleteCategory(cat)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition inline-flex items-center justify-center cursor-pointer align-middle"
                          title="Delete Category"
                          aria-label="Delete Category"
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
      </div>

      {/* Create Modal */}
      <CategoryModal
        isOpen={isCreateOpen}
        isLoading={isSaving}
        onSave={handleSaveCategory}
        onClose={onCloseCreate}
      />

      {/* Edit Modal */}
      <CategoryModal
        isOpen={Boolean(editCategory)}
        category={editCategory}
        isLoading={isSaving}
        onSave={handleSaveCategory}
        onClose={() => setEditCategory(null)}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteCategory)}
        title="Delete Category"
        targetName={deleteCategory?.name || 'Category'}
        warning="Are you sure you want to delete this category? Articles assigned to it might lose their primary category reference."
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteCategory(null)}
      />
    </div>
  );
}
