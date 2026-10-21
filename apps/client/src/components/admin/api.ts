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

  // =========================================================================
  // TEST SERIES SYSTEM (STAGES 1 - 4)
  // =========================================================================

  // 1. Test Series
  getTestSeries: () => apiFetch<AdminTestSeries[]>('/me/test-series'),
  createTestSeries: (data: Partial<AdminTestSeries>) =>
    apiFetch<AdminTestSeries>('/me/test-series', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTestSeries: (id: string, data: Partial<AdminTestSeries>) =>
    apiFetch<AdminTestSeries>(`/me/test-series/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateTestSeriesStatus: (id: string, status: 'draft' | 'published' | 'archived') =>
    apiFetch<AdminTestSeries>(`/me/test-series/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteTestSeries: (id: string) =>
    apiFetch(`/me/test-series/${id}`, {
      method: 'DELETE',
    }),

  // 2. Subjects
  getSubjects: () => apiFetch<AdminSubject[]>('/subjects'),
  createSubject: (data: { name: string; slug: string; description?: string | null; iconUrl?: string | null }) =>
    apiFetch<AdminSubject>('/subjects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubject: (id: string, data: Partial<AdminSubject>) =>
    apiFetch<AdminSubject>(`/subjects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteSubject: (id: string) =>
    apiFetch(`/subjects/${id}`, {
      method: 'DELETE',
    }),

  // 3. Test Series - Subject Assignment
  getSeriesSubjects: (seriesId: string) =>
    apiFetch<AdminTestSeriesSubject[]>(`/me/test-series/${seriesId}/subjects`),
  assignSubjectToSeries: (seriesId: string, data: { subjectId: string; order?: number; customDisplayName?: string | null }) =>
    apiFetch<AdminTestSeriesSubject>(`/me/test-series/${seriesId}/subjects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSubjectAssignment: (seriesId: string, subjectId: string, data: { order?: number; customDisplayName?: string | null }) =>
    apiFetch<AdminTestSeriesSubject>(`/me/test-series/${seriesId}/subjects/${subjectId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  removeSubjectFromSeries: (seriesId: string, subjectId: string) =>
    apiFetch(`/me/test-series/${seriesId}/subjects/${subjectId}`, {
      method: 'DELETE',
    }),

  // 4. Exam-Specific Chapters
  getSeriesChapters: (seriesId: string, subjectId: string) =>
    apiFetch<AdminChapter[]>(`/me/test-series/${seriesId}/subjects/${subjectId}/chapters`),
  createChapter: (seriesId: string, data: { name: string; slug: string; subjectId: string; order?: number; status?: 'draft' | 'published' | 'archived'; description?: string | null }) =>
    apiFetch<AdminChapter>(`/test-series/${seriesId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateChapter: (id: string, data: Partial<AdminChapter>) =>
    apiFetch<AdminChapter>(`/chapters/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteChapter: (id: string) =>
    apiFetch(`/chapters/${id}`, {
      method: 'DELETE',
    }),

  // 5. Central Question Bank
  searchQuestions: (params: {
    search?: string;
    type?: string;
    difficulty?: string;
    subjectId?: string;
    chapterId?: string;
    status?: string;
    isAvailableForNewTests?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.type && params.type !== 'ALL') searchParams.set('type', params.type);
    if (params.difficulty && params.difficulty !== 'ALL') searchParams.set('difficulty', params.difficulty);
    if (params.subjectId && params.subjectId !== 'ALL') searchParams.set('subjectId', params.subjectId);
    if (params.chapterId && params.chapterId !== 'ALL') searchParams.set('chapterId', params.chapterId);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.isAvailableForNewTests) searchParams.set('isAvailableForNewTests', params.isAvailableForNewTests);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
    return apiFetch<{ total: number; limit: number; offset: number; questions: AdminQuestion[] }>(
      `/me/question-bank/search?${searchParams.toString()}`,
    );
  },
  createQuestion: (data: any) =>
    apiFetch<AdminQuestion>('/questions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateQuestion: (id: string, data: any) =>
    apiFetch<AdminQuestion>(`/questions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteQuestion: (id: string) =>
    apiFetch(`/questions/${id}`, {
      method: 'DELETE',
    }),

  // 6. Question Mappings
  getQuestionMappings: (seriesId: string, subjectId: string, chapterId?: string) => {
    const q = chapterId ? `?chapterId=${chapterId}` : '';
    return apiFetch<AdminQuestionMapping[]>(`/test-series/${seriesId}/subjects/${subjectId}/mappings${q}`);
  },
  createQuestionMapping: (data: { questionId: string; testSeriesId: string; subjectId: string; chapterId?: string | null; order?: number }) =>
    apiFetch<AdminQuestionMapping>('/question-mappings', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteQuestionMapping: (id: string) =>
    apiFetch(`/question-mappings/${id}`, {
      method: 'DELETE',
    }),

  // 7. Individual Tests & Test Builder
  getManageableTests: (seriesId: string, params: { testMode?: string; status?: string; subjectId?: string; chapterId?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.testMode && params.testMode !== 'ALL') searchParams.set('testMode', params.testMode);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.subjectId && params.subjectId !== 'ALL') searchParams.set('subjectId', params.subjectId);
    if (params.chapterId && params.chapterId !== 'ALL') searchParams.set('chapterId', params.chapterId);
    return apiFetch<AdminIndividualTest[]>(`/me/test-series/${seriesId}/tests?${searchParams.toString()}`);
  },
  getManageableTest: (testId: string) =>
    apiFetch<AdminIndividualTest>(`/me/test-series/tests/${testId}`),
  createIndividualTest: (data: any) =>
    apiFetch<AdminIndividualTest>('/me/test-series/tests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateIndividualTest: (testId: string, data: any) =>
    apiFetch<AdminIndividualTest>(`/me/test-series/tests/${testId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  updateIndividualTestStatus: (testId: string, status: 'draft' | 'published' | 'archived') =>
    apiFetch<AdminIndividualTest>(`/me/test-series/tests/${testId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  createTestVersion: (testId: string) =>
    apiFetch<AdminIndividualTest>(`/me/test-series/tests/${testId}/versions`, {
      method: 'POST',
    }),
  deleteIndividualTest: (testId: string) =>
    apiFetch(`/me/test-series/tests/${testId}`, {
      method: 'DELETE',
    }),

  // 8. Admin Test Attempts & Performance
  getAttempts: (params: {
    search?: string;
    testSeriesId?: string;
    testId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.testSeriesId && params.testSeriesId !== 'ALL') searchParams.set('testSeriesId', params.testSeriesId);
    if (params.testId && params.testId !== 'ALL') searchParams.set('testId', params.testId);
    if (params.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
    if (params.offset !== undefined) searchParams.set('offset', String(params.offset));
    return apiFetch<{
      items: AdminAttemptListItem[];
      total: number;
      limit: number;
      offset: number;
    }>(`/admin/exam-attempts?${searchParams.toString()}`);
  },
  getAttemptDetail: (attemptId: string) =>
    apiFetch<AdminAttemptDetail>(`/admin/exam-attempts/${attemptId}`),
};

// =========================================================================
// TEST SERIES INTERFACES
// =========================================================================

export interface AdminTestSeries {
  id: string;
  _id?: string;
  title: string;
  slug: string;
  description?: string | null;
  targetExam: string;
  category: string;
  organization?: string | null;
  status: 'draft' | 'published' | 'archived';
  accessType: 'free' | 'premium' | 'freemium';
  supportedLanguages: string[];
  badge?: string | null;
  logoUrl?: string | null;
  order: number;
  subjectsCount?: number;
  testsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminSubject {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  description?: string | null;
  iconUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTestSeriesSubject {
  id: string;
  _id?: string;
  testSeriesId: string;
  subjectId: string;
  order: number;
  customDisplayName?: string | null;
  subject?: AdminSubject | null;
}

export interface AdminChapter {
  id: string;
  _id?: string;
  name: string;
  slug: string;
  testSeriesId: string;
  subjectId: string;
  description?: string | null;
  order: number;
  status: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminQuestionOption {
  id?: string;
  _id?: string;
  content: string;
  translations?: Record<string, string>;
  imageUrl?: string | null;
  position: number;
  isCorrect: boolean;
}

export interface AdminQuestion {
  id: string;
  _id?: string;
  content: string;
  translations?: Record<string, string>;
  explanation?: string | null;
  explanationTranslations?: Record<string, string>;
  type: 'single_choice' | 'multiple_choice' | 'numerical';
  numericalAnswer?: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'published' | 'archived';
  isAvailableForNewTests: boolean;
  subject: string;
  subjectId?: string | null;
  chapterId?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  tags: string[];
  marks: number;
  negativeMarks: number;
  options: AdminQuestionOption[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminQuestionMapping {
  id: string;
  _id?: string;
  questionId: string;
  testSeriesId?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  order: number;
  question?: AdminQuestion | null;
  createdAt?: string;
}

export interface AdminTestSection {
  id?: string;
  name: string;
  topic?: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  order: number;
  durationMinutes?: number | null;
  positiveMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  selectionMode: 'manual' | 'automatic';
  questionOrderMode: 'fixed' | 'randomized';
  questionSetMode: 'fixed' | 'random_per_attempt';
  requiredQuestionCount?: number | null;
  questionsCount?: number;
  questions?: Array<{
    questionId: string;
    position: number;
    marks?: number;
    negativeMarks?: number;
  }>;
}

export interface AdminIndividualTest {
  id: string;
  _id?: string;
  title: string;
  description?: string | null;
  testMode: 'subject' | 'chapter' | 'full';
  type?: string;
  status: 'draft' | 'published' | 'archived';
  access: 'free' | 'premium';
  testSeriesId: string | null;
  subjectId?: string | null;
  chapterId?: string | null;
  durationMinutes?: number | null;
  maxAttempts?: number | null;
  languages: string[];
  instructions?: string | null;
  positiveMarks: number;
  negativeMarkingEnabled: boolean;
  negativeMarks: number;
  questionSelectionMode: 'manual' | 'automatic';
  questionOrderMode: 'fixed' | 'randomized';
  questionSetMode: 'fixed' | 'random_per_attempt';
  totalQuestionsCount: number;
  version: number;
  isCurrentVersion: boolean;
  parentTestId?: string | null;
  availableFrom?: string | null;
  availableTo?: string | null;
  sections?: AdminTestSection[];
  questions?: Array<{
    questionId: string;
    position: number;
    marks?: number;
    negativeMarks?: number;
  }>;
  questionsCount: number;
  createdAt?: string;
  updatedAt?: string;
}

// =========================================================================
// TEST ATTEMPTS & STUDENT PERFORMANCE INTERFACES
// =========================================================================

export interface AdminAttemptListItem {
  id: string;
  _id: string;
  testId: string;
  userId: string;
  attemptNumber: number;
  testVersion: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  score: number;
  marksAwarded: number;
  maximumMarks: number;
  startedAt: string;
  endedAt?: string | null;
  timeSpentSeconds: number;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  test?: {
    id: string;
    title: string;
    testMode: string;
    type?: string;
    durationMinutes?: number | null;
  } | null;
  testSeries?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

export interface AdminAttemptDetailAnswerOption {
  id: string;
  content: string;
  translations?: Record<string, string>;
  imageUrl?: string | null;
  position: number;
  isCorrect?: boolean;
}

export interface AdminAttemptDetailQuestion {
  id: string;
  content: string;
  translations?: Record<string, string>;
  type: 'single_choice' | 'multiple_choice' | 'numerical';
  options: AdminAttemptDetailAnswerOption[];
  marks: number;
  negativeMarks: number;
  explanation?: string | null;
  explanationTranslations?: Record<string, string>;
  numericalAnswer?: string | null;
}

export interface AdminAttemptDetailAnswer {
  id?: string;
  questionId: string;
  sectionId?: string | null;
  optionIds: string[];
  numericalValue?: string | null;
  status: 'not_visited' | 'not_answered' | 'answered' | 'marked_for_review' | 'answered_and_marked_for_review';
  timeSpentSeconds: number;
  answeredAt?: string | null;
  question: AdminAttemptDetailQuestion | null;
  isCorrect?: boolean | null;
  marksAwarded?: number;
  maximumMarks?: number;
  negativeMarks?: number;
}

export interface AdminAttemptSectionProgress {
  sectionId: string;
  name: string;
  timeSpentSeconds: number;
  isCompleted: boolean;
}

export interface AdminAttemptDetail {
  id: string;
  _id: string;
  testId: string;
  userId: string;
  attemptNumber: number;
  testVersion: number;
  status: 'in_progress' | 'submitted' | 'abandoned';
  startedAt: string;
  endedAt?: string | null;
  expiresAt?: string | null;
  timeSpentSeconds: number;
  marksAwarded?: number;
  maximumMarks?: number;
  questionOrder: string[];
  sectionProgress: AdminAttemptSectionProgress[];
  answers: AdminAttemptDetailAnswer[];
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  test?: {
    id: string;
    title: string;
    testMode: string;
    type?: string;
    durationMinutes?: number | null;
  } | null;
  testSeries?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}


