import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/mantine/style.css';
import {
  blocksToBackend,
  backendToBlocks,
  EMPTY_DOCUMENT,
} from './blocknote-map';
import {
  slugify,
  blocksToPlainText,
  type ApiBlog,
  type ApiBlock,
} from '../../lib/blog-render';

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

interface BlogListItem {
  id: string;
  title: string;
  slug: string;
  status: Status;
  description?: string | null;
  coverImage?: string | null;
  updatedAt?: string | null;
  publishedAt?: string | null;
}

interface Props {
  apiUrl: string;
  siteUrl: string;
}

interface Toast {
  kind: 'success' | 'error' | 'info';
  text: string;
}

const META_IDEAL_MIN = 120;
const META_IDEAL_MAX = 160;

async function getClerkToken(): Promise<string | null> {
  const clerk = (window as unknown as { Clerk?: any }).Clerk;
  try {
    return (await clerk?.session?.getToken?.()) ?? null;
  } catch {
    return null;
  }
}

export default function BlogDashboard({ apiUrl, siteUrl }: Props) {
  const theme = useMemo<'light' | 'dark'>(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.classList.contains('theme-dark')
        ? 'dark'
        : 'light',
    [],
  );

  const editor = useCreateBlockNote({ initialContent: EMPTY_DOCUMENT });

  const [posts, setPosts] = useState<BlogListItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | Status>('ALL');
  const [search, setSearch] = useState('');

  const [currentId, setCurrentId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<Status>('DRAFT');

  const [loadingList, setLoadingList] = useState(true);
  const [loadingPost, setLoadingPost] = useState(false);
  const [saving, setSaving] = useState<false | 'DRAFT' | 'PUBLISHED'>(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<number | null>(null);

  const showToast = useCallback((t: Toast) => {
    setToast(t);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const api = useCallback(
    async (path: string, init?: RequestInit) => {
      const token = await getClerkToken();
      const res = await fetch(`${apiUrl}${path}`, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(init?.headers ?? {}),
        },
      });
      return res;
    },
    [apiUrl],
  );

  const loadList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await api('/me/blogs');
      if (res.ok) {
        const data = (await res.json()) as BlogListItem[];
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoadingList(false);
    }
  }, [api]);

  useEffect(() => {
    // Wait briefly for Clerk to be ready, then load the author's posts.
    let tries = 0;
    const tick = async () => {
      const token = await getClerkToken();
      if (token || tries > 20) {
        loadList();
        return;
      }
      tries++;
      window.setTimeout(tick, 200);
    };
    tick();
  }, [loadList]);

  const resetToNew = useCallback(() => {
    setCurrentId(null);
    setTitle('');
    setSlug('');
    setSlugTouched(false);
    setDescription('');
    setCoverImage('');
    setStatus('DRAFT');
    editor.replaceBlocks(editor.document, EMPTY_DOCUMENT);
  }, [editor]);

  const openPost = useCallback(
    async (id: string) => {
      setLoadingPost(true);
      try {
        const res = await api(`/me/blogs/${id}`);
        if (!res.ok) {
          showToast({ kind: 'error', text: 'Could not load that article.' });
          return;
        }
        const blog = (await res.json()) as ApiBlog;
        setCurrentId(blog.id);
        setTitle(blog.title ?? '');
        setSlug(blog.slug ?? '');
        setSlugTouched(true);
        setDescription(blog.description ?? '');
        setCoverImage(blog.coverImage ?? '');
        setStatus((blog.status as Status) ?? 'DRAFT');
        editor.replaceBlocks(
          editor.document,
          backendToBlocks(blog.blocks as ApiBlock[]),
        );
      } catch {
        showToast({ kind: 'error', text: 'Network error loading article.' });
      } finally {
        setLoadingPost(false);
      }
    },
    [api, editor, showToast],
  );

  const onTitleChange = (value: string) => {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const effectiveSlug = slug.trim() || slugify(title);
  const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(effectiveSlug);

  const save = useCallback(
    async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
      const cleanTitle = title.trim();
      const cleanSlug = effectiveSlug;
      if (!cleanTitle) {
        showToast({ kind: 'error', text: 'Please add a title first.' });
        return;
      }
      if (!slugValid) {
        showToast({
          kind: 'error',
          text: 'Slug can only contain lowercase letters, numbers and dashes.',
        });
        return;
      }

      setSaving(targetStatus);
      try {
        const blocks = await blocksToBackend(editor);
        const autoDescription =
          description.trim() ||
          blocksToPlainText(blocks).slice(0, 157).trim();

        const metadata = {
          title: cleanTitle,
          slug: cleanSlug,
          description: autoDescription || null,
          coverImage: coverImage.trim() || null,
          status: targetStatus,
        };

        if (!currentId) {
          const res = await api('/blogs', {
            method: 'POST',
            body: JSON.stringify({ ...metadata, blocks }),
          });
          if (res.status === 409) {
            showToast({ kind: 'error', text: 'That slug is already in use.' });
            return;
          }
          if (!res.ok) {
            showToast({ kind: 'error', text: 'Could not save the article.' });
            return;
          }
          const created = (await res.json()) as ApiBlog;
          setCurrentId(created.id);
          setStatus(targetStatus);
          setSlugTouched(true);
          showToast({
            kind: 'success',
            text:
              targetStatus === 'PUBLISHED'
                ? 'Article published 🎉'
                : 'Draft saved.',
          });
        } else {
          const res = await api(`/blogs/${currentId}`, {
            method: 'PATCH',
            body: JSON.stringify(metadata),
          });
          if (res.status === 409) {
            showToast({ kind: 'error', text: 'That slug is already in use.' });
            return;
          }
          if (!res.ok) {
            showToast({ kind: 'error', text: 'Could not update the article.' });
            return;
          }
          const blocksRes = await api(`/blogs/${currentId}/blocks`, {
            method: 'PUT',
            body: JSON.stringify({ blocks }),
          });
          if (!blocksRes.ok) {
            showToast({
              kind: 'error',
              text: 'Saved details, but content failed to save.',
            });
            return;
          }
          setStatus(targetStatus);
          showToast({
            kind: 'success',
            text:
              targetStatus === 'PUBLISHED'
                ? 'Article published & updated 🎉'
                : 'Changes saved.',
          });
        }
        await loadList();
      } catch {
        showToast({ kind: 'error', text: 'Unexpected error while saving.' });
      } finally {
        setSaving(false);
      }
    },
    [
      api,
      editor,
      currentId,
      title,
      effectiveSlug,
      slugValid,
      description,
      coverImage,
      loadList,
      showToast,
    ],
  );

  const deletePost = useCallback(
    async (id: string) => {
      if (!window.confirm('Delete this article permanently?')) return;
      try {
        const res = await api(`/blogs/${id}`, { method: 'DELETE' });
        if (res.ok || res.status === 204) {
          showToast({ kind: 'success', text: 'Article deleted.' });
          if (currentId === id) resetToNew();
          await loadList();
        } else {
          showToast({ kind: 'error', text: 'Could not delete the article.' });
        }
      } catch {
        showToast({ kind: 'error', text: 'Network error during delete.' });
      }
    },
    [api, currentId, loadList, resetToNew, showToast],
  );

  const filteredPosts = posts.filter((p) => {
    const matchStatus = filter === 'ALL' || p.status === filter;
    const q = search.trim().toLowerCase();
    const matchSearch = !q || p.title.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const publicUrl = `${siteUrl.replace(/\/$/, '')}/articles/${effectiveSlug}`;
  const metaLen = (description.trim() || '').length;
  const metaState =
    metaLen === 0
      ? 'empty'
      : metaLen < META_IDEAL_MIN
        ? 'short'
        : metaLen > META_IDEAL_MAX
          ? 'long'
          : 'good';

  const published = status === 'PUBLISHED';

  const statusLabel =
    status === 'PUBLISHED' ? 'Published' : status === 'ARCHIVED' ? 'Archived' : 'Draft';

  return (
    <div className="min-h-screen bg-canvas text-white px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col gap-4 pb-6 border-b border-border sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-caption-sm text-muted">
              <a href="/admin" className="hover:text-accent">Admin</a>
              <span>/</span>
              <span className="text-white font-medium">Article editor</span>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-heading-md font-bold text-white">Write an article</h1>
              <span className={status === 'PUBLISHED' ? 'badge-accent' : 'badge-outline'}>
                {statusLabel}
              </span>
            </div>
            <p className="text-body-sm text-muted mt-1">
              Exam notices, jobs, results and study guides. One headline, then the article body.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {published && currentId && (
              <a className="btn-outline inline-flex items-center" href={publicUrl} target="_blank" rel="noreferrer">
                View
              </a>
            )}
            <button className="btn-secondary" onClick={() => save('DRAFT')} disabled={saving !== false}>
              {saving === 'DRAFT' ? 'Saving…' : 'Save draft'}
            </button>
            <button className="btn-primary" onClick={() => save('PUBLISHED')} disabled={saving !== false}>
              {saving === 'PUBLISHED' ? 'Publishing…' : published ? 'Update' : 'Publish'}
            </button>
          </div>
        </header>

        {toast && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-body-sm font-medium ${
              toast.kind === 'error'
                ? 'border-error/40 bg-surface text-error'
                : toast.kind === 'success'
                  ? 'border-success/40 bg-surface text-success'
                  : 'border-border bg-surface text-muted'
            }`}
          >
            {toast.text}
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-12">
          <aside className="card-flat flex max-h-[calc(100vh-8rem)] flex-col gap-3 p-4 xl:col-span-3 xl:sticky xl:top-6">
            <div className="flex items-center justify-between">
              <h2 className="text-heading-sm font-semibold text-white">Articles</h2>
              <button className="btn-primary" onClick={resetToNew}>New</button>
            </div>
            <input
              className="input"
              placeholder="Search articles"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex gap-2">
              {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map((f) => {
                const active = filter === f;
                const label = f === 'ALL' ? 'All' : f === 'PUBLISHED' ? 'Published' : 'Drafts';
                return (
                  <button
                    key={f}
                    className={active ? 'badge-accent' : 'badge-outline'}
                    onClick={() => setFilter(f)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {loadingList && <p className="py-6 text-center text-body-sm text-muted">Loading…</p>}
              {!loadingList && filteredPosts.length === 0 && (
                <p className="py-6 text-center text-body-sm text-muted">No articles yet.</p>
              )}
              {filteredPosts.map((p) => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openPost(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openPost(p.id);
                  }}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    currentId === p.id
                      ? 'border-accent bg-surface-raised'
                      : 'border-border bg-canvas hover:bg-surface-raised'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-body-sm font-semibold text-white">{p.title || 'Untitled'}</p>
                    <p className="mt-1 flex items-center gap-2 text-caption-xs text-muted">
                      <span className={p.status === 'PUBLISHED' ? 'text-success' : 'text-muted'}>
                        {p.status === 'PUBLISHED' ? 'Live' : p.status === 'ARCHIVED' ? 'Archived' : 'Draft'}
                      </span>
                      <span className="truncate">/{p.slug}</span>
                    </p>
                  </div>
                  <button
                    className="btn-icon text-muted hover:text-error"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePost(p.id);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </aside>

          <main className="flex min-w-0 flex-col gap-4 xl:col-span-6">
            <input
              className="w-full bg-transparent text-heading-lg font-bold text-white placeholder:text-muted focus:outline-none"
              placeholder="Article headline"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
            <div className="card relative min-h-[28rem] overflow-hidden p-2">
              {loadingPost && (
                <div className="absolute inset-0 z-raised grid place-items-center bg-surface/80 text-body-sm text-muted">
                  Loading article…
                </div>
              )}
              <div className="studio-editor">
                <BlockNoteView editor={editor} theme={theme} />
              </div>
            </div>
            <p className="text-caption-sm text-muted">
              Type <kbd className="rounded-xs border border-border bg-surface-raised px-1.5 py-0.5 font-mono text-caption-xs">/</kbd> to add a heading, list, table, image, quote or code block.
            </p>
          </main>

          <aside className="card-flat flex flex-col gap-4 p-5 xl:col-span-3 xl:sticky xl:top-6">
            <h2 className="text-heading-sm font-semibold text-white">SEO</h2>

            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-white">URL slug</span>
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3">
                <span className="shrink-0 text-caption-sm text-muted">/articles/</span>
                <input
                  className="w-full bg-transparent py-2 text-body-sm text-white placeholder:text-muted focus:outline-none"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugTouched(true);
                  }}
                  placeholder={slugify(title) || 'article-slug'}
                />
              </div>
              {!slugValid && effectiveSlug.length > 0 && (
                <span className="text-caption-xs text-error">Use lowercase letters, numbers and dashes.</span>
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-label font-medium text-white">
                Meta description
                <span
                  className={
                    metaState === 'good'
                      ? 'text-caption-xs text-success'
                      : metaState === 'long'
                        ? 'text-caption-xs text-error'
                        : 'text-caption-xs text-muted'
                  }
                >
                  {metaLen}/{META_IDEAL_MAX}
                </span>
              </span>
              <textarea
                className="input min-h-24 resize-y"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this notice covers, in one or two sentences."
              />
              <span className="text-caption-xs text-muted">
                {metaState === 'long'
                  ? 'Search results may cut this off.'
                  : metaState === 'short'
                    ? 'Aim for about 120–160 characters.'
                    : 'Length looks right.'}
              </span>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-white">Cover image</span>
              <input
                className="input"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="https://…"
              />
              {coverImage.trim() && (
                <img className="max-h-36 w-full rounded-xl border border-border object-cover" src={coverImage} alt="Cover preview" />
              )}
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-label font-medium text-white">Status</span>
              <select className="input" value={status} onChange={(e) => setStatus(e.target.value as Status)}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>

            <div className="rounded-xl border border-border bg-canvas p-3">
              <p className="text-caption-xs text-muted">Search preview</p>
              <p className="mt-1 truncate text-caption-sm text-success">{publicUrl}</p>
              <p className="mt-1 text-body-sm font-medium text-accent">
                {title || 'Your article title'}
              </p>
              <p className="mt-1 text-caption-sm text-muted">
                {description.trim() || 'Meta description shows here once you write it.'}
              </p>
            </div>

            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <p className="text-label font-medium text-white">Before you publish</p>
              <Check ok={title.trim().length > 0} label="Clear headline" />
              <Check ok={slugValid} label="Valid slug" />
              <Check ok={metaLen >= META_IDEAL_MIN && metaLen <= META_IDEAL_MAX} label="Description length" />
              <Check ok={coverImage.trim().length > 0} label="Cover image" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-body-xs">
      <span
        className={`grid size-4 place-items-center rounded-xs border text-caption-xs ${
          ok ? 'border-success bg-success text-on-fill' : 'border-border text-transparent'
        }`}
      >
        ✓
      </span>
      <span className={ok ? 'text-white' : 'text-muted'}>{label}</span>
    </div>
  );
}
