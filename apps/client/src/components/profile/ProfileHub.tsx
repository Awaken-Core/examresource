import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "../../lib/api";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  emailVerified?: boolean;
  preferredLanguage?: "English" | "Hindi";
  targetExam?: string | null;
  targetSeriesIds?: string[];
  examGoalDate?: string | null;
};

type AttemptAnswer = {
  id?: string;
  questionId?: string;
  subjectId?: string | null;
  chapterId?: string | null;
  topic?: string | null;
  difficulty?: string | null;
  status?: string;
  timeSpentSeconds?: number;
  isCorrect?: boolean;
  marksAwarded?: number;
  maximumMarks?: number;
};

type Attempt = {
  id: string;
  _id?: string;
  testId: string;
  attemptNumber: number;
  status: "in_progress" | "submitted" | "abandoned";
  startedAt: string;
  endedAt?: string | null;
  expiresAt?: string | null;
  timeSpentSeconds?: number | null;
  marksAwarded?: number;
  maximumMarks?: number;
  test?: {
    id: string;
    title: string;
    testMode?: string;
    type?: string;
    durationMinutes?: number;
    totalMarks?: number;
  } | null;
  answers?: AttemptAnswer[];
};

type TestSeriesItem = {
  id?: string;
  _id?: string;
  title: string;
  slug: string;
  category?: string;
};

type TabKey = "overview" | "my-tests" | "performance" | "weak-topics" | "settings";
type LoadState = "loading" | "ready" | "signed-out" | "error";

export function ProfileHub() {
  const [state, setState] = useState<LoadState>("loading");
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [testSeriesList, setTestSeriesList] = useState<TestSeriesItem[]>([]);

  // Settings form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState<"English" | "Hindi">("English");
  const [targetExam, setTargetExam] = useState("");
  const [examGoalDate, setExamGoalDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Test list filter state
  const [testFilter, setTestFilter] = useState<"all" | "in_progress" | "submitted">("all");

  useEffect(() => {
    const controller = new AbortController();

    async function loadData() {
      try {
        const [meRes, attemptsRes, seriesRes] = await Promise.all([
          fetch(`${API_URL}/me`, {
            credentials: "include",
            signal: controller.signal,
          }),
          fetch(`${API_URL}/me/exam-attempts`, {
            credentials: "include",
            signal: controller.signal,
          }),
          fetch(`${API_URL}/test-series`, {
            signal: controller.signal,
          }).catch(() => null),
        ]);

        if (!meRes.ok) {
          if (meRes.status === 401) {
            setState("signed-out");
            return;
          }
          throw new Error("Unable to load profile data.");
        }

        const me = (await meRes.json()) as User | null;
        if (!me) {
          setState("signed-out");
          return;
        }

        const loadedAttempts = attemptsRes.ok
          ? ((await attemptsRes.json()) as Attempt[])
          : [];

        let loadedSeries: TestSeriesItem[] = [];
        if (seriesRes && seriesRes.ok) {
          const seriesData = await seriesRes.json();
          loadedSeries = Array.isArray(seriesData)
            ? seriesData
            : Array.isArray(seriesData?.data)
            ? seriesData.data
            : [];
        }

        setUser(me);
        setName(me.name || "");
        setPhone(me.phone || "");
        setPreferredLanguage(me.preferredLanguage || "English");
        setTargetExam(me.targetExam || "");
        setExamGoalDate(
          me.examGoalDate ? me.examGoalDate.slice(0, 10) : ""
        );
        setAttempts(loadedAttempts);
        setTestSeriesList(loadedSeries);
        setState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setState("error");
      }
    }

    void loadData();
    return () => controller.abort();
  }, []);

  // Sync tab with URL hash if present
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace("#", "") as TabKey;
    if (["overview", "my-tests", "performance", "weak-topics", "settings"].includes(hash)) {
      setActiveTab(hash);
    }
  }, []);

  function handleTabChange(tab: TabKey) {
    setActiveTab(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
    }
  }

  // Analytics derivations
  const stats = useMemo(() => {
    const totalTests = attempts.length;
    const completedAttempts = attempts.filter((a) => a.status === "submitted");
    const inProgressAttempts = attempts.filter((a) => a.status === "in_progress");

    let totalSeconds = 0;
    for (const a of attempts) {
      if (typeof a.timeSpentSeconds === "number" && a.timeSpentSeconds > 0) {
        totalSeconds += a.timeSpentSeconds;
      } else if (a.startedAt && a.endedAt) {
        const diff = Math.floor((new Date(a.endedAt).getTime() - new Date(a.startedAt).getTime()) / 1000);
        if (diff > 0) totalSeconds += diff;
      }
    }

    // Accuracy across completed tests
    let totalAnswered = 0;
    let totalCorrect = 0;
    let totalMarks = 0;
    let totalMaxMarks = 0;

    for (const a of completedAttempts) {
      if (typeof a.marksAwarded === "number" && typeof a.maximumMarks === "number" && a.maximumMarks > 0) {
        totalMarks += a.marksAwarded;
        totalMaxMarks += a.maximumMarks;
      }

      if (a.answers && a.answers.length > 0) {
        for (const ans of a.answers) {
          const isAnswered = ans.status === "answered" || ans.status === "marked_for_review_answered";
          if (isAnswered || ans.isCorrect !== undefined) {
            totalAnswered++;
            if (ans.isCorrect) totalCorrect++;
          }
        }
      }
    }

    const accuracyPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : null;
    const averageScorePercent = totalMaxMarks > 0 ? Math.round((totalMarks / totalMaxMarks) * 100) : null;

    return {
      totalTests,
      completedCount: completedAttempts.length,
      inProgressCount: inProgressAttempts.length,
      totalStudySeconds: totalSeconds,
      accuracyPercent,
      averageScorePercent,
      totalAnswered,
      totalCorrect,
      completedAttempts,
      inProgressAttempts,
    };
  }, [attempts]);

  // Weak topics calculation from completed attempts' answers
  const weakTopics = useMemo(() => {
    type TopicStat = {
      name: string;
      subjectId?: string | null;
      attempted: number;
      correct: number;
      accuracy: number;
    };

    const map = new Map<string, { total: number; correct: number; subjectId?: string | null }>();

    for (const attempt of stats.completedAttempts) {
      if (!attempt.answers) continue;
      for (const ans of attempt.answers) {
        const key = ans.topic || ans.chapterId || ans.subjectId || "General";
        const current = map.get(key) || { total: 0, correct: 0, subjectId: ans.subjectId };
        const isAnswered = ans.status === "answered" || ans.status === "marked_for_review_answered" || ans.isCorrect !== undefined;
        if (isAnswered) {
          current.total += 1;
          if (ans.isCorrect) current.correct += 1;
          map.set(key, current);
        }
      }
    }

    const result: TopicStat[] = [];
    for (const [name, val] of map.entries()) {
      if (val.total > 0) {
        const accuracy = Math.round((val.correct / val.total) * 100);
        result.push({
          name,
          subjectId: val.subjectId,
          attempted: val.total,
          correct: val.correct,
          accuracy,
        });
      }
    }

    // Sort: lowest accuracy first (weakest topics first)
    return result.sort((a, b) => a.accuracy - b.accuracy);
  }, [stats.completedAttempts]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_URL}/me`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Protection": "1",
        },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          preferredLanguage,
          targetExam: targetExam.trim() || null,
          examGoalDate: examGoalDate ? new Date(examGoalDate).toISOString() : null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message || "Failed to save profile changes.");
      }

      const updated = payload as User;
      setUser(updated);
      setName(updated.name);
      setPhone(updated.phone ?? "");
      setPreferredLanguage(updated.preferredLanguage || "English");
      setTargetExam(updated.targetExam || "");
      setExamGoalDate(updated.examGoalDate ? updated.examGoalDate.slice(0, 10) : "");
      setMessage({ text: "Profile settings saved successfully.", type: "success" });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to save profile.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function formatDuration(totalSeconds: number) {
    if (totalSeconds <= 0) return "0 min";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} mins`;
  }

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <div className="h-44 w-full animate-pulse rounded-2xl border border-border bg-surface p-6" />
        <div className="h-12 w-full animate-pulse rounded-xl border border-border bg-surface" />
        <div className="h-64 w-full animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (state === "signed-out") {
    return (
      <section className="mx-auto max-w-xl rounded-2xl border border-border bg-surface p-8 text-center shadow-xs">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zm7 8a7 7 0 00-14 0" />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">Your Personal Preparation Hub</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Sign in to track your mock tests, monitor chapter weaknesses, review accuracy trends, and manage your exam goals.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/login?redirect=/profile"
            className="inline-flex items-center justify-center rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          >
            Sign In
          </a>
          <a
            href="/register?redirect=/profile"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-surface-raised px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-surface-raised/80"
          >
            Create Free Account
          </a>
        </div>
      </section>
    );
  }

  if (state === "error" || !user) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400">
        <p className="font-semibold text-white">Could not load your preparation profile</p>
        <p className="mt-1">Please check your connection and refresh the page.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const initials = user.name
    ? user.name
        .split(/\s+/)
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  // Filtered tests
  const filteredAttempts = attempts.filter((a) => {
    if (testFilter === "in_progress") return a.status === "in_progress";
    if (testFilter === "submitted") return a.status === "submitted";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          TOP AREA: Student identity, target exam, language, metrics
          ───────────────────────────────────────────────────────────── */}
      <header className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
        <div className="bg-gradient-to-r from-accent/20 via-accent/5 to-transparent px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-accent/40 bg-accent/15 text-xl font-extrabold text-accent shadow-xs">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="truncate text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                    {user.name}
                  </h1>
                  <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">
                    {user.role}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">{user.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  {/* Target Exam Tag */}
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-white">
                    <span className="text-accent" aria-hidden="true">🎯</span>
                    <span className="text-muted">Target:</span>
                    <span className="font-semibold text-white">
                      {user.targetExam || "Not set yet"}
                    </span>
                  </div>

                  {/* Preferred Language Tag */}
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-white">
                    <span className="text-accent" aria-hidden="true">🌐</span>
                    <span className="text-muted">Language:</span>
                    <span className="font-semibold text-white">{user.preferredLanguage || "English"}</span>
                  </div>

                  {/* Goal Date if set */}
                  {user.examGoalDate && (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised px-2.5 py-1 text-white">
                      <span className="text-accent" aria-hidden="true">📅</span>
                      <span className="text-muted">Goal:</span>
                      <span className="font-semibold text-white">
                        {new Date(user.examGoalDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Edit Action Button */}
            <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => handleTabChange("settings")}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-raised px-3.5 py-2 text-xs font-semibold text-white transition hover:border-accent hover:text-accent"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Profile</span>
              </button>
              <a
                href="/test-series"
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
              >
                <span>Explore Tests</span>
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>

        {/* 4 Summary Aggregate Metrics Bar */}
        <div className="grid grid-cols-2 divide-x divide-y sm:divide-y-0 sm:grid-cols-4 divide-border border-t border-border">
          <MetricBlock
            label="Tests Attempted"
            value={stats.totalTests.toString()}
            subtitle={`${stats.completedCount} done · ${stats.inProgressCount} active`}
            icon="📝"
          />
          <MetricBlock
            label="Overall Accuracy"
            value={stats.accuracyPercent !== null ? `${stats.accuracyPercent}%` : "--"}
            subtitle={stats.totalAnswered > 0 ? `${stats.totalCorrect}/${stats.totalAnswered} correct` : "No submissions"}
            icon="🎯"
            valueClass={
              stats.accuracyPercent !== null
                ? stats.accuracyPercent >= 75
                  ? "text-emerald-400"
                  : stats.accuracyPercent >= 50
                  ? "text-amber-400"
                  : "text-red-400"
                : "text-white"
            }
          />
          <MetricBlock
            label="Average Score"
            value={stats.averageScorePercent !== null ? `${stats.averageScorePercent}%` : "--"}
            subtitle={stats.completedCount > 0 ? `Across ${stats.completedCount} mock${stats.completedCount === 1 ? "" : "s"}` : "Start a test"}
            icon="📊"
          />
          <MetricBlock
            label="Study Time"
            value={formatDuration(stats.totalStudySeconds)}
            subtitle="Time spent in tests"
            icon="⏱️"
          />
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          NAVIGATION TABS: Overview | My Tests | Performance | Weak Topics | Profile & Settings
          ───────────────────────────────────────────────────────────── */}
      <nav aria-label="Preparation Navigation" className="flex overflow-x-auto border-b border-border pb-1">
        <div className="flex gap-2">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => handleTabChange("overview")}
            label="Overview"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }
          />
          <TabButton
            active={activeTab === "my-tests"}
            onClick={() => handleTabChange("my-tests")}
            label="My Tests"
            badge={attempts.length > 0 ? attempts.length : undefined}
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <TabButton
            active={activeTab === "performance"}
            onClick={() => handleTabChange("performance")}
            label="Performance"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
          <TabButton
            active={activeTab === "weak-topics"}
            onClick={() => handleTabChange("weak-topics")}
            label="Weak Topics"
            badge={weakTopics.filter((t) => t.accuracy < 60).length > 0 ? `${weakTopics.filter((t) => t.accuracy < 60).length}` : undefined}
            badgeColor="bg-amber-500/20 text-amber-300"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />
          <TabButton
            active={activeTab === "settings"}
            onClick={() => handleTabChange("settings")}
            label="Profile & Settings"
            icon={
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: OVERVIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Active test banner if an in-progress attempt exists */}
          {stats.inProgressAttempts.length > 0 && (
            <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 shadow-xs">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">Active Test in Progress</p>
                    <h2 className="text-base font-bold text-white">
                      {stats.inProgressAttempts[0]?.test?.title || "Exam in progress"}
                    </h2>
                    <p className="text-xs text-muted">
                      Started: {new Date(stats.inProgressAttempts[0]?.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
                <a
                  href={`/exams/${stats.inProgressAttempts[0]?.testId}/attempt`}
                  className="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
                >
                  Resume Test →
                </a>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            {/* Recent test activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Recent Test Activity</h2>
                <button
                  type="button"
                  onClick={() => handleTabChange("my-tests")}
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  View all ({attempts.length})
                </button>
              </div>

              {attempts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
                  <p className="text-base font-semibold text-white">No mock tests attempted yet</p>
                  <p className="mt-1 text-xs text-muted">
                    Take your first test to start generating accuracy and chapter diagnostics.
                  </p>
                  <a
                    href="/test-series"
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    <span>Browse Mock Tests</span>
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {attempts.slice(0, 4).map((attempt) => (
                    <AttemptCard key={attempt.id} attempt={attempt} />
                  ))}
                </div>
              )}
            </div>

            {/* Preparation Roadmap & Quick Shortcuts */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white">Target & Readiness</h2>
              <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 shadow-xs">
                <div>
                  <p className="text-xs font-medium text-muted">Target Exam</p>
                  <p className="mt-0.5 text-base font-bold text-white">
                    {user.targetExam || "Not yet set"}
                  </p>
                  {!user.targetExam && (
                    <button
                      type="button"
                      onClick={() => handleTabChange("settings")}
                      className="mt-2 text-xs font-semibold text-accent hover:underline"
                    >
                      Set target exam in settings →
                    </button>
                  )}
                </div>

                <div className="border-t border-border pt-3">
                  <p className="text-xs font-medium text-muted">Study Language</p>
                  <p className="mt-0.5 text-sm font-semibold text-white">
                    {user.preferredLanguage || "English"}
                  </p>
                </div>

                {user.examGoalDate && (
                  <div className="border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted">Exam Target Date</p>
                    <p className="mt-0.5 text-sm font-semibold text-white">
                      {new Date(user.examGoalDate).toLocaleDateString(undefined, {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}

                <div className="rounded-xl border border-border bg-surface-raised/40 p-4">
                  <p className="text-xs font-bold text-white">Next Step for You</p>
                  <p className="mt-1 text-xs text-muted leading-relaxed">
                    {stats.completedCount === 0
                      ? "Attempt a full-length mock test to assess your speed and timing baseline."
                      : stats.accuracyPercent !== null && stats.accuracyPercent < 70
                      ? "Review the questions you missed in Weak Topics and revisit foundational notes."
                      : "Great accuracy! Continue practicing timed sectionals to improve question speed."}
                  </p>
                  <a
                    href="/test-series"
                    className="mt-3 inline-flex text-xs font-bold text-accent hover:underline"
                  >
                    Go to test catalog →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: MY TESTS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "my-tests" && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-white">All Test Attempts ({attempts.length})</h2>
            <div className="flex items-center gap-1.5 rounded-xl border border-border bg-surface p-1">
              <FilterPill
                active={testFilter === "all"}
                onClick={() => setTestFilter("all")}
                label="All"
                count={attempts.length}
              />
              <FilterPill
                active={testFilter === "submitted"}
                onClick={() => setTestFilter("submitted")}
                label="Completed"
                count={stats.completedCount}
              />
              <FilterPill
                active={testFilter === "in_progress"}
                onClick={() => setTestFilter("in_progress")}
                label="In Progress"
                count={stats.inProgressCount}
              />
            </div>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <p className="text-base font-semibold text-white">No tests match this filter</p>
              <p className="mt-1 text-xs text-muted">
                {testFilter === "in_progress"
                  ? "You have no tests currently in progress."
                  : "You have not completed any tests yet."}
              </p>
              <a
                href="/test-series"
                className="mt-4 inline-flex items-center gap-1 rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white"
              >
                Start a New Test
              </a>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAttempts.map((attempt) => (
                <AttemptCard key={attempt.id} attempt={attempt} detailed />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: PERFORMANCE
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "performance" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-white">Preparation Performance Diagnostics</h2>
            <p className="mt-1 text-xs text-muted">
              Cumulative metrics derived from your completed test papers.
            </p>

            {stats.completedCount === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-surface-raised/40 p-8 text-center">
                <p className="text-sm font-semibold text-white">No performance data yet</p>
                <p className="mt-1 text-xs text-muted">
                  Submit at least one test to unlock accuracy curves, speed diagnostics, and score distributions.
                </p>
                <a
                  href="/test-series"
                  className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white"
                >
                  Take a Mock Test
                </a>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                {/* Accuracy breakdown bar */}
                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">Questions Accuracy Breakdown</span>
                    <span className="text-muted">
                      {stats.totalCorrect} correct out of {stats.totalAnswered} questions attempted ({stats.accuracyPercent}%)
                    </span>
                  </div>
                  <div className="mt-2 h-4 w-full overflow-hidden rounded-full bg-surface-raised flex">
                    <div
                      style={{ width: `${stats.accuracyPercent || 0}%` }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Correct: ${stats.accuracyPercent}%`}
                    />
                    <div
                      style={{ width: `${100 - (stats.accuracyPercent || 0)}%` }}
                      className="bg-red-500/80 transition-all duration-500"
                      title="Incorrect / Missed"
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Correct: {stats.totalCorrect}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-red-500/80" />
                      Incorrect: {stats.totalAnswered - stats.totalCorrect}
                    </span>
                  </div>
                </div>

                {/* Performance Cards Grid */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-border bg-surface-raised/50 p-4">
                    <p className="text-xs text-muted">Average Score Rate</p>
                    <p className="mt-1 text-2xl font-extrabold text-white">
                      {stats.averageScorePercent !== null ? `${stats.averageScorePercent}%` : "--"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">Across all completed mock attempts</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised/50 p-4">
                    <p className="text-xs text-muted">Pacing (Time per test)</p>
                    <p className="mt-1 text-2xl font-extrabold text-white">
                      {stats.completedCount > 0
                        ? formatDuration(Math.round(stats.totalStudySeconds / stats.completedCount))
                        : "--"}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">Average test attempt duration</p>
                  </div>
                  <div className="rounded-xl border border-border bg-surface-raised/50 p-4">
                    <p className="text-xs text-muted">Total Practice Hours</p>
                    <p className="mt-1 text-2xl font-extrabold text-accent">
                      {(stats.totalStudySeconds / 3600).toFixed(1)} hrs
                    </p>
                    <p className="mt-1 text-[11px] text-muted">Active examination time</p>
                  </div>
                </div>

                {/* Score history list */}
                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-bold text-white">Completed Tests Score History</h3>
                  <div className="mt-3 divide-y divide-border rounded-xl border border-border bg-surface-raised/30 overflow-hidden">
                    {stats.completedAttempts.slice(0, 5).map((att) => {
                      const scorePct =
                        att.maximumMarks && att.maximumMarks > 0
                          ? Math.round(((att.marksAwarded || 0) / att.maximumMarks) * 100)
                          : null;
                      return (
                        <div key={att.id} className="flex items-center justify-between p-3 text-xs sm:px-4">
                          <div>
                            <p className="font-semibold text-white">{att.test?.title || "Exam attempt"}</p>
                            <p className="text-muted text-[11px]">
                              {new Date(att.startedAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">
                              {att.marksAwarded ?? 0} / {att.maximumMarks ?? 0}
                            </p>
                            <p className="text-[11px] font-semibold text-accent">
                              {scorePct !== null ? `${scorePct}%` : ""}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: WEAK TOPICS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "weak-topics" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Topic Diagnostic & Revision Planner</h2>
                <p className="mt-1 text-xs text-muted">
                  Identifies subjects and topics where accuracy falls below target, based on your answered questions.
                </p>
              </div>
            </div>

            {weakTopics.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-surface-raised/40 p-8 text-center">
                <p className="text-sm font-semibold text-white">No topic diagnostic data available yet</p>
                <p className="mt-1 text-xs text-muted">
                  Complete questions in mock tests and sectionals to identify your strong and weak topics.
                </p>
                <a
                  href="/test-series"
                  className="mt-4 inline-flex rounded-xl bg-accent px-4 py-2 text-xs font-bold text-white"
                >
                  Practice Questions Now
                </a>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {weakTopics.map((item, idx) => {
                  const isNeedsRevision = item.accuracy < 60;
                  const isStrong = item.accuracy >= 75;

                  return (
                    <div
                      key={idx}
                      className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised/40 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{item.name}</span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                              isNeedsRevision
                                ? "bg-red-500/15 text-red-400 border border-red-500/30"
                                : isStrong
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            {isNeedsRevision
                              ? "Needs Revision"
                              : isStrong
                              ? "Strong"
                              : "Moderate"}
                          </span>
                        </div>
                        <p className="text-xs text-muted">
                          {item.correct} correct of {item.attempted} attempted questions
                        </p>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{item.accuracy}%</p>
                          <p className="text-[10px] text-muted">Accuracy</p>
                        </div>
                        <a
                          href="/test-series"
                          className="inline-flex items-center justify-center rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-accent transition hover:border-accent"
                        >
                          Practice
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: PROFILE & SETTINGS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "settings" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Main Settings Form */}
          <section className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="text-base font-bold text-white">Learner Profile & Exam Preferences</h2>
            <p className="mt-1 text-xs text-muted">
              Configure your preparation goals, target exam, and preferred language.
            </p>

            <form onSubmit={saveProfile} className="mt-6 space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-white">
                  Full Name
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength={2}
                    maxLength={100}
                    required
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-white placeholder-muted outline-none transition focus:border-accent"
                  />
                </label>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-white">
                  Phone Number <span className="font-normal text-muted">(optional)</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    minLength={7}
                    maxLength={20}
                    placeholder="+91 98765 43210"
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-white placeholder-muted outline-none transition focus:border-accent"
                  />
                </label>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-semibold text-white">Preferred Test Language</label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage("English")}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      preferredLanguage === "English"
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface-raised text-muted hover:text-white"
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredLanguage("Hindi")}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      preferredLanguage === "Hindi"
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-border bg-surface-raised text-muted hover:text-white"
                    }`}
                  >
                    Hindi (हिंदी)
                  </button>
                </div>
              </div>

              {/* Target Exam */}
              <div>
                <label className="block text-xs font-semibold text-white">
                  Target Exam / Preferred Test Series
                </label>
                <div className="mt-1.5 space-y-2">
                  {testSeriesList.length > 0 && (
                    <select
                      value={testSeriesList.some((s) => s.title === targetExam) ? targetExam : ""}
                      onChange={(e) => {
                        if (e.target.value) setTargetExam(e.target.value);
                      }}
                      className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-accent"
                    >
                      <option value="">Select from published test series...</option>
                      {testSeriesList.map((ts) => (
                        <option key={ts.id || ts._id || ts.slug} value={ts.title}>
                          {ts.title}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="text"
                    value={targetExam}
                    onChange={(e) => setTargetExam(e.target.value)}
                    placeholder="Or type custom target (e.g. DSSSB TGT CS 2026, UGC NET CS)"
                    maxLength={120}
                    className="w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-white placeholder-muted outline-none transition focus:border-accent"
                  />
                </div>
              </div>

              {/* Exam Goal Date */}
              <div>
                <label className="block text-xs font-semibold text-white">
                  Exam Goal / Target Date <span className="font-normal text-muted">(optional)</span>
                  <input
                    type="date"
                    value={examGoalDate}
                    onChange={(e) => setExamGoalDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-accent"
                  />
                </label>
              </div>

              {/* Feedback messages */}
              {message && (
                <div
                  className={`rounded-xl p-3 text-xs ${
                    message.type === "success"
                      ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      : "border border-red-500/30 bg-red-500/10 text-red-400"
                  }`}
                  role="status"
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? "Saving Changes…" : "Save Profile & Preferences"}
              </button>
            </form>
          </section>

          {/* Account & Security Summary */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-white">Account Details</h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-muted">Account Email</span>
                  <p className="mt-0.5 font-semibold text-white">{user.email}</p>
                </div>

                <div className="border-t border-border pt-2">
                  <span className="text-muted">Verification Status</span>
                  <p className="mt-0.5">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </span>
                    ) : (
                      <span className="font-semibold text-amber-400">Unverified</span>
                    )}
                  </p>
                </div>

                <div className="border-t border-border pt-2">
                  <span className="text-muted">Account Role</span>
                  <p className="mt-0.5 font-semibold capitalize text-white">{user.role}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <a
                  href="/bookmarks"
                  className="inline-flex w-full items-center justify-between rounded-xl border border-border bg-surface-raised px-3.5 py-2.5 text-xs font-semibold text-white transition hover:border-accent hover:text-accent"
                >
                  <span>Saved Bookmarks & Questions</span>
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────

function MetricBlock({
  label,
  value,
  subtitle,
  icon,
  valueClass = "text-white",
}: {
  label: string;
  value: string;
  subtitle: string;
  icon: string;
  valueClass?: string;
}) {
  return (
    <div className="p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-base" aria-hidden="true">{icon}</span>
      </div>
      <p className={`mt-1.5 text-2xl font-extrabold tracking-tight ${valueClass}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] text-muted truncate">{subtitle}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  badge,
  badgeColor = "bg-accent/20 text-accent",
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: string | number;
  badgeColor?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition ${
        active
          ? "bg-accent text-white shadow-xs"
          : "text-muted hover:bg-surface-raised hover:text-white"
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && (
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
            active ? "bg-white/20 text-white" : badgeColor
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? "bg-accent text-white"
          : "text-muted hover:text-white"
      }`}
    >
      {label}
      {count !== undefined ? ` (${count})` : ""}
    </button>
  );
}

function AttemptCard({
  attempt,
  detailed = false,
}: {
  attempt: Attempt;
  detailed?: boolean;
}) {
  const isInProgress = attempt.status === "in_progress";
  const isSubmitted = attempt.status === "submitted";

  const scorePct =
    attempt.maximumMarks && attempt.maximumMarks > 0
      ? Math.round(((attempt.marksAwarded || 0) / attempt.maximumMarks) * 100)
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 transition hover:border-border/80 sm:flex-row sm:items-center sm:justify-between shadow-xs">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-sm text-white">
            {attempt.test?.title || `Mock Test #${attempt.attemptNumber}`}
          </h3>
          <span
            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isInProgress
                ? "border border-amber-500/40 bg-amber-500/10 text-amber-300"
                : isSubmitted
                ? "border border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                : "border border-border bg-surface-raised text-muted"
            }`}
          >
            {isInProgress ? "In Progress" : isSubmitted ? "Completed" : attempt.status}
          </span>
          <span className="text-[11px] text-muted">
            Attempt #{attempt.attemptNumber}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            {new Date(attempt.startedAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          {typeof attempt.timeSpentSeconds === "number" && attempt.timeSpentSeconds > 0 && (
            <span>⏱️ {Math.round(attempt.timeSpentSeconds / 60)} mins</span>
          )}
          {attempt.test?.durationMinutes && (
            <span>⏳ {attempt.test.durationMinutes} min limit</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 self-end sm:self-center">
        {isSubmitted && attempt.maximumMarks !== undefined && (
          <div className="text-right">
            <p className="text-sm font-bold text-white">
              {attempt.marksAwarded ?? 0} / {attempt.maximumMarks}
            </p>
            {scorePct !== null && (
              <p className="text-[11px] font-semibold text-accent">{scorePct}% Score</p>
            )}
          </div>
        )}

        {isInProgress ? (
          <a
            href={`/exams/${attempt.testId}/attempt`}
            className="inline-flex items-center gap-1 rounded-xl bg-accent px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:opacity-95"
          >
            <span>Resume</span>
            <span aria-hidden="true">→</span>
          </a>
        ) : (
          <a
            href={`/test-series/results/${attempt.id}`}
            className="inline-flex items-center gap-1 rounded-xl border border-border bg-surface-raised px-3 py-2 text-xs font-semibold text-white transition hover:border-accent hover:text-accent"
          >
            <span>View Analysis</span>
            <span aria-hidden="true">→</span>
          </a>
        )}
      </div>
    </div>
  );
}
