import { useState, useEffect } from 'react';
import { API_URL, getCachedCurrentUser, isClientAuthenticated } from '../../lib/api';

const QUICK_CATEGORIES = [
  'Question Quality',
  'Difficulty Level',
  'Explanation Clarity',
  'Timer & Performance',
  'Syllabus Relevance',
  'Other Suggestions',
] as const;

export function TestResultFeedback({
  testId,
  testTitle,
  attemptId,
}: Readonly<{
  testId: string;
  testTitle: string;
  attemptId: string;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string>('Question Quality');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const isAuth = isClientAuthenticated();
    const cached = getCachedCurrentUser();
    if (isAuth && cached) {
      setIsAuthenticated(true);
    }

    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setIsAuthenticated(true);
        } else if (!cached) {
          setIsAuthenticated(false);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a brief feedback comment.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
        body: JSON.stringify({
          source: 'test_result',
          rating,
          category,
          message: message.trim(),
          testId,
          testTitle,
          attemptId,
        }),
      });

      if (res.status === 401) {
        setIsAuthenticated(false);
        throw new Error('Please sign in to submit feedback.');
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to submit feedback.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.pathname : '/',
  )}`;

  if (submitted) {
    return (
      <section
        aria-labelledby="feedback-heading"
        className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-6 sm:p-7 shadow-xs text-center transition-all font-['Geist']"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-xl mb-3 border border-emerald-500/20">
          ✓
        </div>
        <h3 id="feedback-heading" className="text-base font-bold text-heading">
          Thank You for Your Feedback!
        </h3>
        <p className="mt-1 text-xs text-muted max-w-md mx-auto">
          Your feedback on <span className="font-semibold text-heading">{testTitle}</span> has been saved. Our editorial and academic team reviews learner suggestions to continuously improve question quality and explanations.
        </p>
      </section>
    );
  }

  // Unauthenticated Candidate Banner
  if (!isAuthenticated) {
    return (
      <section
        aria-labelledby="feedback-heading"
        className="rounded-2xl border border-border bg-surface p-6 sm:p-7 shadow-xs text-center font-['Geist'] space-y-3"
      >
        <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 text-accent mx-auto flex items-center justify-center font-bold text-lg">
          🔒
        </div>
        <div>
          <h2 id="feedback-heading" className="text-base font-bold text-heading">
            Test Feedback &amp; Quality Review
          </h2>
          <p className="mt-1 text-xs text-muted max-w-sm mx-auto leading-relaxed">
            Sign in to rate this test, report any discrepancies, or share suggestions with our academic moderation team.
          </p>
        </div>
        <div className="pt-1">
          <a
            href={loginRedirectUrl}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-accent/90 transition cursor-pointer"
          >
            <span>Sign In to Leave Feedback</span>
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="feedback-heading"
      className="rounded-2xl border border-border bg-surface p-6 sm:p-8 shadow-xs font-['Geist']"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-border/70">
        <div>
          <h2 id="feedback-heading" className="text-base font-bold text-heading">
            7. Test Feedback &amp; Quality Review
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            How was this mock test? Help us improve our test questions, answer keys, and exam timer.
          </p>
        </div>

        {/* 5-Star Rating Row */}
        <div className="flex items-center gap-1.5 pt-1 sm:pt-0">
          <span className="text-xs font-medium text-muted mr-1">Rating:</span>
          {[1, 2, 3, 4, 5].map((star) => {
            const active = (hoverRating ?? rating) >= star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                className="p-1 text-lg sm:text-xl transition-transform hover:scale-110 cursor-pointer focus:outline-hidden"
                aria-label={`Rate ${star} of 5 stars`}
              >
                <span className={active ? 'text-amber-400 drop-shadow-xs' : 'text-slate-300 dark:text-slate-700'}>
                  ★
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        {/* Category Pills */}
        <fieldset className="border-0 p-0 m-0">
          <legend className="block text-xs font-semibold text-heading mb-2">
            Select Feedback Topic
          </legend>
          <div className="flex flex-wrap gap-2">
            {QUICK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  category === cat
                    ? 'bg-accent text-white shadow-2xs'
                    : 'bg-surface-raised border border-border text-muted hover:border-accent/40 hover:text-heading'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Comment Text Area */}
        <div>
          <label htmlFor="feedback-comment" className="block text-xs font-semibold text-heading mb-1.5">
            Your Comments or Suggestions
          </label>
          <textarea
            id="feedback-comment"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Share your thoughts about the questions, explanation clarity, or any discrepancies..."
            className="w-full rounded-xl border border-border bg-canvas px-3.5 py-2.5 text-xs text-heading placeholder:text-muted/60 focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent transition resize-none"
            maxLength={3000}
            required
          />
        </div>

        {error && (
          <p className="text-xs font-medium text-rose-500 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted">
            Submitted directly to the academic moderation team.
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </section>
  );
}
