import React, { useState, useEffect, useCallback } from 'react';
import { adminApi, type CurrentUser, type Category } from './api';
import { AdminToastProvider } from './AdminToast';
import { ArticlesManager } from './ArticlesManager';
import { CategoriesManager } from './CategoriesManager';
import { UsersManager } from './UsersManager';
import { NotificationsManager } from './NotificationsManager';
import { CategoryModal } from './CategoryModal';
import { TestSeriesManager } from './TestSeriesManager';
import { HierarchyManager } from './HierarchyManager';
import { QuestionBankManager } from './QuestionBankManager';
import { TestBuilderManager } from './TestBuilderManager';
import { TestAttemptsManager } from './TestAttemptsManager';
import type { AdminTestSeries } from './api';

export type AdminTab =
  | 'posts'
  | 'categories'
  | 'users'
  | 'notifications'
  | 'series'
  | 'hierarchy'
  | 'question-bank'
  | 'test-builder'
  | 'attempts';

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

function AdminAppContent({ initialTab = 'posts' }: { initialTab?: AdminTab }) {
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [selectedSeriesForNav, setSelectedSeriesForNav] = useState<AdminTestSeries | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Mobile sidebar state
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Shared Categories state for Articles & Categories managers
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isCreateCategoryModalOpen, setIsCreateCategoryModalOpen] = useState(false);

  // Dark/Light theme state
  const [isDark, setIsDark] = useState(false);

  // Load theme preference
  useEffect(() => {
    const isDarkTheme = document.documentElement.classList.contains('theme-dark');
    setIsDark(isDarkTheme);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const newDark = !isDark;
    setIsDark(newDark);
    root.classList.toggle('theme-dark', newDark);
    root.classList.toggle('theme-light', !newDark);
    root.style.colorScheme = newDark ? 'dark' : 'light';
    localStorage.setItem('theme_preference', newDark ? 'dark' : 'light');
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
  };

  // Sync tab with browser URL history
  useEffect(() => {
    function handlePopState() {
      const path = window.location.pathname;
      if (path.includes('/users')) {
        setActiveTab('users');
      } else if (path.includes('/notifications')) {
        setActiveTab('notifications');
      } else if (path.includes('/attempts')) {
        setActiveTab('attempts');
      } else if (path.includes('/series')) {
        setActiveTab('series');
      } else if (path.includes('/hierarchy')) {
        setActiveTab('hierarchy');
      } else if (path.includes('/question-bank')) {
        setActiveTab('question-bank');
      } else if (path.includes('/test-builder')) {
        setActiveTab('test-builder');
      } else if (window.location.hash === '#categories-section') {
        setActiveTab('categories');
      } else if (window.location.hash === '#attempts') {
        setActiveTab('attempts');
      } else {
        setActiveTab('posts');
      }
    }

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Smooth client-side tab switcher with URL history updates
  const switchTab = (tab: AdminTab) => {
    setActiveTab(tab);
    setIsMobileOpen(false);

    let targetUrl = '/admin';
    if (tab === 'users') targetUrl = '/admin/users';
    else if (tab === 'notifications') targetUrl = '/admin/notifications';
    else if (tab === 'attempts') targetUrl = '/admin#attempts';
    else if (tab === 'series') targetUrl = '/admin#series';
    else if (tab === 'hierarchy') targetUrl = '/admin#hierarchy';
    else if (tab === 'question-bank') targetUrl = '/admin#question-bank';
    else if (tab === 'test-builder') targetUrl = '/admin#test-builder';
    else if (tab === 'categories') targetUrl = '/admin#categories-section';

    if (window.location.pathname !== targetUrl && !targetUrl.includes('#')) {
      window.history.pushState(null, '', targetUrl);
    } else if (targetUrl.includes('#')) {
      window.history.pushState(null, '', targetUrl);
    } else {
      window.history.pushState(null, '', '/admin');
    }
  };

  // Auth verification
  useEffect(() => {
    async function checkAuth() {
      setIsVerifyingAuth(true);
      try {
        const user = await adminApi.getCurrentUser();
        if (!user) {
          const returnTo = window.location.pathname + window.location.search;
          window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
          return;
        }

        const isAdminTab = activeTab === 'users' || activeTab === 'notifications';
        const hasAccess = isAdminTab
          ? user.role === 'admin'
          : user.role === 'admin' || user.role === 'editor';

        if (!hasAccess) {
          window.location.replace('/');
          return;
        }

        setCurrentUser(user);
        document.documentElement.classList.remove('auth-pending');
      } catch (err: any) {
        setAuthError(err?.message || 'Access verification failed. Please sign in again.');
        const returnTo = window.location.pathname + window.location.search;
        window.location.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`);
      } finally {
        setIsVerifyingAuth(false);
      }
    }

    checkAuth();
  }, [activeTab]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const data = await adminApi.getCategories();
      setCategories(data || []);
    } catch {
      // Ignored here; handled in child components
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCategories();
    }
  }, [currentUser, fetchCategories]);

  // Loading screen while verifying auth
  if (isVerifyingAuth) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md animate-pulse">
            EP
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Verifying editorial access...</span>
          </div>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200">
        <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">Access Restricted</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400">{authError}</p>
          <a
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition"
          >
            Sign in with Authorized Account
          </a>
        </div>
      </div>
    );
  }

  const tabTitle =
    activeTab === 'posts'
      ? 'Articles'
      : activeTab === 'categories'
      ? 'Blog Categories'
      : activeTab === 'series'
      ? 'Test Series'
      : activeTab === 'hierarchy'
      ? 'Subjects & Chapters'
      : activeTab === 'question-bank'
      ? 'Question Bank'
      : activeTab === 'test-builder'
      ? 'Test Builder'
      : activeTab === 'attempts'
      ? 'Student Test Attempts'
      : activeTab === 'users'
      ? 'Users'
      : 'Notifications';

  return (
    <div className="h-screen w-screen flex bg-slate-50 dark:bg-[#131316] text-slate-900 dark:text-zinc-100 overflow-hidden font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-60 bg-white dark:bg-zinc-900 border-r border-slate-200 dark:border-zinc-800 flex flex-col justify-between transition-transform duration-200 ease-in-out shrink-0 lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Top CMS Brand */}
          <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => switchTab('posts')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs tracking-tight">
                EP
              </div>
              <div className="leading-tight">
                <span className="block text-xs font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                  ExamPortal
                </span>
                <span className="block text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                  Admin CMS
                </span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer"
              aria-label="Close menu"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => switchTab('posts')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'posts'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              <span>Articles</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('categories')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'categories'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span>Blog Categories</span>
            </button>

            <a
              href="/editor"
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition"
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Write Article</span>
            </a>

            {/* Test Series Platform Management */}
            <div className="pt-3 pb-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                Test Series Platform
              </span>
            </div>

            <button
              type="button"
              onClick={() => switchTab('series')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'series'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              <span>Test Series</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('hierarchy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'hierarchy'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              <span>Subjects & Chapters</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('question-bank')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'question-bank'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Question Bank</span>
            </button>

            <button
              type="button"
              onClick={() => switchTab('test-builder')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                activeTab === 'test-builder'
                  ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                  : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Test Builder</span>
            </button>

            {currentUser?.role === 'admin' && (
              <>
                <button
                  type="button"
                  onClick={() => switchTab('attempts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    activeTab === 'attempts'
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  <span>Test Attempts</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('users')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    activeTab === 'users'
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87m-1-12.15a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>Users & Access</span>
                </button>

                <button
                  type="button"
                  onClick={() => switchTab('notifications')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition cursor-pointer text-left ${
                    activeTab === 'notifications'
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-900 dark:text-white font-semibold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span>Notifications</span>
                </button>
              </>
            )}

            <div className="pt-4 pb-1">
              <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                External
              </span>
            </div>

            <a
              href="/blog"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>Public Blog</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">↗</span>
            </a>

            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800/60 hover:text-slate-900 dark:hover:text-white transition"
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-slate-400 dark:text-zinc-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>XML Sitemap</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">↗</span>
            </a>
          </nav>
        </div>

        {/* User Account Footer & Theme Toggle */}
        <div className="p-3 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 overflow-hidden shadow-xs">
              {(() => {
                const name = (currentUser?.name || currentUser?.email || 'Admin').trim();
                const parts = name.split(/\s+/).filter(Boolean);
                return parts.length > 1
                  ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                  : name.slice(0, 2).toUpperCase();
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-semibold text-slate-800 dark:text-zinc-200 truncate">
                {currentUser?.name || currentUser?.email || 'Editorial Staff'}
              </span>
              <span className="block text-[10px] font-mono text-slate-400 dark:text-zinc-500 uppercase">
                {currentUser?.role || 'ADMIN'}
              </span>
            </div>
            <a
              href="/"
              title="Exit to Public Site"
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between px-4 sm:px-6 shrink-0 z-30 shadow-2xs">
          {/* Left: Mobile trigger & breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer"
              aria-label="Open navigation drawer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-zinc-400">
              <button
                type="button"
                onClick={() => switchTab('posts')}
                className="hover:text-slate-800 dark:hover:text-zinc-200 font-medium transition cursor-pointer"
              >
                Admin
              </button>
              <span>/</span>
              <span className="font-semibold text-slate-900 dark:text-zinc-100">{tabTitle}</span>
            </div>
          </div>

          {/* Right Header Controls: Theme toggle + Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700 transition cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? (
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCreateCategoryModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs rounded-lg shadow-2xs transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Category</span>
            </button>

            <a
              href="/editor"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow-2xs transition cursor-pointer"
              style={{ backgroundColor: '#2563EB' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Write Article</span>
            </a>
          </div>
        </header>

        {/* Scrollable Main Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'posts' && (
              <ArticlesManager
                categories={categories}
                onOpenCreateCategory={() => setIsCreateCategoryModalOpen(true)}
                onRefreshCategories={fetchCategories}
              />
            )}

            {activeTab === 'categories' && (
              <CategoriesManager
                categories={categories}
                isLoading={isLoadingCategories}
                onRefresh={fetchCategories}
                onOpenCreate={() => setIsCreateCategoryModalOpen(true)}
                isCreateOpen={isCreateCategoryModalOpen}
                onCloseCreate={() => setIsCreateCategoryModalOpen(false)}
              />
            )}

            {activeTab === 'users' && <UsersManager currentUser={currentUser} />}

            {activeTab === 'notifications' && <NotificationsManager />}

            {activeTab === 'series' && (
              <TestSeriesManager
                currentUserRole={currentUser?.role}
                onSelectSeriesForHierarchy={(series) => {
                  setSelectedSeriesForNav(series);
                  switchTab('hierarchy');
                }}
                onSelectSeriesForTests={(series) => {
                  setSelectedSeriesForNav(series);
                  switchTab('test-builder');
                }}
              />
            )}

            {activeTab === 'hierarchy' && (
              <HierarchyManager
                initialSeriesId={selectedSeriesForNav?.id || selectedSeriesForNav?._id}
                onNavigateToTests={(series) => {
                  setSelectedSeriesForNav(series);
                  switchTab('test-builder');
                }}
              />
            )}

            {activeTab === 'question-bank' && (
              <QuestionBankManager currentUserRole={currentUser?.role} />
            )}

            {activeTab === 'test-builder' && (
              <TestBuilderManager
                currentUserRole={currentUser?.role}
                initialSeriesId={selectedSeriesForNav?.id || selectedSeriesForNav?._id}
              />
            )}

            {activeTab === 'attempts' && (
              <TestAttemptsManager />
            )}
          </div>
        </main>
      </div>

      {/* Global Quick Create Category Modal */}
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
