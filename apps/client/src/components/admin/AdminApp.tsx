import { useCallback, useEffect, useState } from 'react';
import { siteDomain, siteName } from '../../data/site';
import {
  DESK_PATH,
  deskGate,
  loadSession,
  peekSession,
  roleLabel,
  type DeskUser,
} from '../../lib/adminSession';
import { adminApi, type Category } from './api';
import { AdminToastProvider } from './AdminToast';
import { ArticlesManager } from './ArticlesManager';
import { CategoriesManager } from './CategoriesManager';
import { CommentsManager } from './CommentsManager';
import { NotificationsManager } from './NotificationsManager';
import { UsersManager } from './UsersManager';
import { CategoryModal } from './CategoryModal';
import { DeskMark } from './DeskMark';
import { SessionPanel } from './SessionPanel';

export type AdminTab = 'posts' | 'categories' | 'users' | 'notifications' | 'comments';

const TAB_TITLES: Record<AdminTab, string> = {
  posts: 'Articles',
  categories: 'Categories',
  users: 'People',
  notifications: 'Notices',
  comments: 'Comments',
};

interface AdminAppProps {
  initialTab?: AdminTab;
}

export default function AdminApp({ initialTab = 'posts' }: AdminAppProps) {
  return (
    <AdminToastProvider>
      <AdminAppContent initialTab={initialTab} />
    </AdminToastProvider>
  );
}

function brandParts() {
  const [prefix, ...rest] = siteDomain.split('.');
  return { prefix, suffix: rest.length ? `.${rest.join('.')}` : '' };
}

function AdminAppContent({ initialTab = 'posts' }: { initialTab?: AdminTab }) {
  const cached = typeof window !== 'undefined' ? peekSession() : undefined;
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [mountedTabs, setMountedTabs] = useState<AdminTab[]>([initialTab]);
  const [currentUser, setCurrentUser] = useState<DeskUser | null>(cached ?? null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(!cached);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const { prefix, suffix } = brandParts();

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('theme-dark'));
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = !isDark;
    setIsDark(next);
    root.classList.toggle('theme-dark', next);
    root.classList.toggle('theme-light', !next);
    root.style.colorScheme = next ? 'dark' : 'light';
    localStorage.setItem('theme_preference', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      if (path.startsWith(`${DESK_PATH}/users`)) setActiveTab('users');
      else if (path.startsWith(`${DESK_PATH}/notifications`)) setActiveTab('notifications');
      else if (path.startsWith(`${DESK_PATH}/comments`)) setActiveTab('comments');
      else if (window.location.hash === '#categories-section') setActiveTab('categories');
      else setActiveTab('posts');
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setMountedTabs((prev) => (prev.includes(activeTab) ? prev : [...prev, activeTab]));
    document.title = `${TAB_TITLES[activeTab]} · ${siteName} Desk`;
  }, [activeTab]);

  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);
    const target =
      tab === 'users'
        ? `${DESK_PATH}/users`
        : tab === 'notifications'
          ? `${DESK_PATH}/notifications`
          : tab === 'comments'
            ? `${DESK_PATH}/comments`
            : tab === 'categories'
              ? `${DESK_PATH}#categories-section`
              : DESK_PATH;
    window.history.pushState(null, '', target);
  };

  useEffect(() => {
    let cancelled = false;

    async function checkAuth(force = false) {
      try {
        const user = await loadSession(force);
        if (cancelled) return;
        const gate = deskGate(user, window.location.pathname);
        if (gate === 'login') {
          const returnTo = window.location.pathname + window.location.search;
          window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }
        if (gate === 'home') {
          window.location.replace('/');
          return;
        }
        if (gate === 'posts') {
          setActiveTab('posts');
          window.history.replaceState(null, '', DESK_PATH);
        }
        setCurrentUser((prev) =>
          prev &&
          user &&
          prev.id === user.id &&
          prev.role === user.role &&
          prev.name === user.name &&
          prev.email === user.email
            ? prev
            : user,
        );
        setAuthError(null);
        document.documentElement.classList.remove('auth-pending');
      } catch (err: any) {
        if (cancelled || force) return;
        setAuthError(err?.message || 'Access verification failed. Please sign in again.');
        document.documentElement.classList.remove('auth-pending');
      } finally {
        if (!cancelled) setIsVerifyingAuth(false);
      }
    }

    checkAuth(false);

    function onVisible() {
      if (document.visibilityState === 'visible') checkAuth(true);
    }
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data || []);
    } catch {
      /* child views surface their own empty states */
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) fetchCategories();
  }, [currentUser, fetchCategories]);

  if (isVerifyingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-canvas desk-fg">
        <div className="flex items-center gap-3 text-sm text-muted">
          <DeskMark size={28} />
          <span>Opening Desk…</span>
        </div>
      </div>
    );
  }

  if (authError || !currentUser) {
    return (
      <div className="h-screen w-screen flex items-center justify-center p-4 bg-canvas desk-fg">
        <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 text-center space-y-3 shadow-elevated">
          <h2 className="text-base font-semibold">Desk is unavailable</h2>
          <p className="text-sm text-muted">{authError || 'Sign in with an editor or administrator account.'}</p>
          <a href="/login" className="inline-flex px-4 py-2 rounded-full bg-accent desk-on-accent text-sm font-medium">
            Sign in
          </a>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="h-screen w-screen flex bg-canvas desk-fg overflow-hidden font-sans">
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-canvas border-r border-border flex flex-col justify-between transition-transform duration-200 ease-out shrink-0 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="min-h-0 flex flex-col">
          <div className="h-16 px-4 flex items-center justify-between border-b border-border/60">
            <button type="button" onClick={() => switchTab('posts')} className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer">
              <DeskMark size={32} />
              <span className="min-w-0">
                <span className="flex items-baseline font-bold text-[15px] tracking-tight desk-fg">
                  <span className="truncate">{prefix}</span>
                  <span className="text-accent">{suffix}</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">Desk</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-muted desk-hover hover:bg-surface-raised cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="p-3 space-y-0.5 overflow-y-auto" aria-label="Desk">
            <NavGroup label="Library" />
            <NavButton active={activeTab === 'posts'} onClick={() => switchTab('posts')} icon="articles" label="Articles" />
            <NavButton active={activeTab === 'categories'} onClick={() => switchTab('categories')} icon="categories" label="Categories" />
            <NavButton active={activeTab === 'comments'} onClick={() => switchTab('comments')} icon="comments" label="Comments" />
            <a
              href="/editor"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium text-muted desk-hover hover:bg-surface-raised border border-transparent"
            >
              <NavIcon name="write" />
              <span>Write</span>
            </a>

            {isAdmin && (
              <>
                <NavGroup label="Access" />
                <NavButton active={activeTab === 'users'} onClick={() => switchTab('users')} icon="people" label="People" />
                <NavButton active={activeTab === 'notifications'} onClick={() => switchTab('notifications')} icon="notices" label="Notices" />
              </>
            )}

            <NavGroup label="Site" />
            <a
              href="/"
              className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium text-muted desk-hover hover:bg-surface-raised border border-transparent"
            >
              <span className="flex items-center gap-3">
                <NavIcon name="site" />
                View site
              </span>
              <span aria-hidden="true" className="text-[10px] text-muted">↗</span>
            </a>
          </nav>
        </div>

        <div className="p-3 border-t border-border/60">
          <button
            type="button"
            onClick={() => setSessionOpen(true)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-raised text-left cursor-pointer"
          >
            <span className="w-8 h-8 rounded-full bg-surface border border-border text-[11px] font-bold flex items-center justify-center shrink-0">
              {(currentUser.name || currentUser.email || 'S').slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold truncate">{currentUser.name || currentUser.email}</span>
              <span className="block text-[11px] text-muted truncate">{roleLabel(currentUser.role)}</span>
            </span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 sm:h-16 bg-surface/95 border-b border-border/60 flex items-center justify-between px-3 sm:px-5 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-muted desk-hover hover:bg-surface-raised border border-border/60 cursor-pointer"
              aria-label="Open navigation"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <p className="text-[11px] text-muted leading-none">Desk</p>
              <h1 className="text-sm font-semibold truncate">{TAB_TITLES[activeTab]}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center rounded-xl border border-border/60 text-muted desk-hover hover:bg-surface-raised cursor-pointer"
              aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <a href="/editor" className="inline-flex items-center h-9 px-3.5 rounded-full bg-accent desk-on-accent text-xs font-medium">
              Write
            </a>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="max-w-6xl mx-auto">
            {mountedTabs.includes('posts') && (
              <div hidden={activeTab !== 'posts'}>
                <ArticlesManager
                  categories={categories}
                  onOpenCreateCategory={() => setIsCreateCategoryModalOpen(true)}
                  onRefreshCategories={fetchCategories}
                />
              </div>
            )}
            {mountedTabs.includes('categories') && (
              <div hidden={activeTab !== 'categories'}>
                <CategoriesManager
                  categories={categories}
                  isLoading={isLoadingCategories}
                  onRefresh={fetchCategories}
                  onOpenCreate={() => setIsCreateCategoryModalOpen(true)}
                  isCreateOpen={isCreateCategoryModalOpen}
                  onCloseCreate={() => setIsCreateCategoryModalOpen(false)}
                />
              </div>
            )}
            {isAdmin && mountedTabs.includes('users') && (
              <div hidden={activeTab !== 'users'}>
                <UsersManager currentUser={currentUser} />
              </div>
            )}
            {isAdmin && mountedTabs.includes('notifications') && (
              <div hidden={activeTab !== 'notifications'}>
                <NotificationsManager />
              </div>
            )}
            {mountedTabs.includes('comments') && (
              <div hidden={activeTab !== 'comments'}>
                <CommentsManager />
              </div>
            )}
          </div>
        </main>
      </div>

      {sessionOpen && <SessionPanel user={currentUser} onClose={() => setSessionOpen(false)} />}

      <CategoryModal
        isOpen={isCreateCategoryModalOpen}
        onSave={async (data) => {
          await adminApi.createCategory(data);
          fetchCategories();
        }}
        onClose={() => setIsCreateCategoryModalOpen(false)}
      />
    </div>
  );
}

function NavGroup({ label }: { label: string }) {
  return <p className="px-3.5 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>;
}

function NavButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs text-left cursor-pointer border ${
        active
          ? 'bg-accent/10 text-accent font-semibold border-accent/20'
          : 'text-muted desk-hover hover:bg-surface-raised font-medium border-transparent'
      }`}
    >
      <NavIcon name={icon} />
      <span>{label}</span>
    </button>
  );
}

type IconName = 'articles' | 'categories' | 'comments' | 'write' | 'people' | 'notices' | 'site';

function NavIcon({ name }: { name: IconName }) {
  const common = 'w-4 h-4 shrink-0';
  if (name === 'articles') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    );
  }
  if (name === 'categories') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    );
  }
  if (name === 'comments') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5M7 19l-3 2V6a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H7z" />
      </svg>
    );
  }
  if (name === 'write') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    );
  }
  if (name === 'people') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87m-1-12.15a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    );
  }
  if (name === 'notices') {
    return (
      <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}
