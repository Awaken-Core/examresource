import { API_URL } from '../../lib/api';

export interface Post {
  id: string;
  title: string;
  slug: string;
  status: 'PUBLISHED' | 'DRAFT' | 'SCHEDULED' | 'ARCHIVED';
  updatedAt?: string;
  createdAt?: string;
  categoryId?: string | null;
  category?: { id: string; name: string; slug: string } | null;
  categories?: Array<{ id: string; name: string; slug: string }>;
  languages?: Array<{ language: 'ENGLISH' | 'HINGLISH'; id: string }>;
  language?: 'ENGLISH' | 'HINGLISH';
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  postCount?: number;
  _count?: { blogs: number };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'editor' | 'admin';
  status: string;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  kind: 'welcome' | 'blog' | 'broadcast';
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  actor?: { name: string } | null;
  sender?: { name: string } | null;
}

export interface CurrentUser {
  id: string;
  name?: string;
  email: string;
  role: 'admin' | 'editor' | 'student';
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    headers.set('X-CSRF-Protection', '1');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData?.message) {
        errorMsg = Array.isArray(errorData.message)
          ? errorData.message.join(', ')
          : errorData.message;
      }
    } catch {
      // Non-JSON error payload
    }
    throw new Error(errorMsg);
  }

  // Handle empty responses (like 204 No Content)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return null as unknown as T;
}

export const adminApi = {
  // Current user
  getCurrentUser: () => apiFetch<CurrentUser>('/me'),

  // Articles
  getArticles: (params: {
    search?: string;
    status?: string;
    categoryId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.categoryId && params.categoryId !== 'ALL') searchParams.set('categoryId', params.categoryId);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
    return apiFetch<Post[]>(`/me/blogs?${searchParams.toString()}`);
  },

  updateArticle: (id: string, data: Partial<Post> & { categoryIds?: string[] }) =>
    apiFetch<Post>(`/blogs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteArticle: (id: string) =>
    apiFetch(`/blogs/${id}`, {
      method: 'DELETE',
    }),

  // Categories
  getCategories: () => apiFetch<Category[]>('/categories'),

  createCategory: (data: { name: string; slug: string; description?: string | null }) =>
    apiFetch<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCategory: (id: string, data: { name: string; slug: string; description?: string | null }) =>
    apiFetch<Category>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteCategory: (id: string) =>
    apiFetch(`/categories/${id}`, {
      method: 'DELETE',
    }),

  // Users
  getUsers: () => apiFetch<User[]>('/users'),

  updateUserRole: (id: string, role: 'student' | 'editor' | 'admin') =>
    apiFetch(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // Notifications
  getNotifications: () => apiFetch<NotificationItem[]>('/notifications'),

  sendNotification: (data: { title: string; body: string; href?: string | null }) =>
    apiFetch('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
