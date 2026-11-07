import { useState, useEffect } from 'react';
import { API_URL, getCachedCurrentUser, isClientAuthenticated } from '../../lib/api';

const FOOTER_CATEGORIES = [
  'Suggestion',
  'Bug / Technical Issue',
  'Content / Syllabus Request',
  'Compliment',
  'Other',
] as const;

export function FooterFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [rating, setRating] = useState<number>(5);
  const [category, setCategory] = useState<string>('Suggestion');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check auth on mount and whenever modal is opened
  useEffect(() => {
    const isAuth = isClientAuthenticated();
    const cached = getCachedCurrentUser();
    if (isAuth && cached) {
      setIsAuthenticated(true);
    }

    if (isOpen) {
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
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter your feedback or suggestion.');
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
          source: 'footer',
          rating,
          category,
          message: message.trim(),
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
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setMessage('');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Close dialog on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(
    typeof window !== 'undefined' ? window.location.pathname : '/',
  )}`;

  function renderDialogBody() {
    if (!isAuthenticated) {
      return (
        <div className="py-6 text-center space-y-3.5">
          <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 text-accent mx-auto flex items-center justify-center font-bold text-xl">
            🔒
          </div>
          <div>
            <h3 id="footer-feedback-title" className="text-base font-bold text-heading">
              Sign In to Leave Feedback
            </h3>
            <p className="text-xs text-muted mt-1 max-w-xs mx-auto leading-relaxed">
              Feedback is exclusively enabled for registered learners so our academic team can review your suggestions and attribute them to your account.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <a
              href={loginRedirectUrl}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-accent/90 transition cursor-pointer"
            >
              <span>Sign In Now</span>
              <span aria-hidden="true">→</span>
            </a>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-muted hover:text-heading transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    if (submitted) {
      return (
        <div className="py-6 text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center font-bold text-xl border border-emerald-500/20">
            ✓
          </div>
          <h3 className="text-base font-bold text-heading">Feedback Received!</h3>
          <p className="text-xs text-muted">
            Thank you for helping us improve GovtPariksha. We appreciate your insights!
          </p>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <h3 id="footer-feedback-title" className="text-base font-bold text-heading tracking-tight">
            Share Your Feedback
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Suggestions, platform ideas, or bug reports - we read all learner notes.
          </p>
        </div>

        {/* Rating Stars */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-xs text-muted mr-1 font-medium">Experience:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-0.5 text-lg transition-transform hover:scale-110 cursor-pointer"
            >
              <span className={rating >= star ? 'text-amber-400' : 'text-slate-300 dark:text-slate-700'}>
                ★
              </span>
            </button>
          ))}
        </div>

        {/* Categories */}
        <fieldset className="border-0 p-0 m-0">
          <legend className="block text-[11px] font-semibold text-muted mb-1.5 uppercase tracking-wider">
            Topic
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {FOOTER_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition cursor-pointer ${
                  category === cat
                    ? 'bg-accent text-white shadow-2xs'
                    : 'bg-surface-raised border border-border text-muted hover:text-heading'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Message */}
        <div>
          <label htmlFor="footer-feedback-msg" className="block text-[11px] font-semibold text-muted mb-1 uppercase tracking-wider">
            Message
          </label>
          <textarea
            id="footer-feedback-msg"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tell us what you like or what we can improve..."
            className="w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-heading placeholder:text-muted/60 focus:border-accent focus:outline-hidden focus:ring-1 focus:ring-accent transition resize-none"
            maxLength={3000}
            required
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 dark:text-rose-400">{error}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-3 py-1.5 text-xs font-semibold text-muted hover:text-heading transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-accent/90 disabled:opacity-50 transition cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Send Feedback'}
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {/* Trigger Button in Footer */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-raised hover:bg-surface-raised/80 border border-border text-[11.5px] font-semibold text-heading transition-colors cursor-pointer"
        aria-label="Open feedback dialog"
      >
        <svg aria-hidden="true" className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
        <span>Give Feedback</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <dialog
          open
          aria-labelledby="footer-feedback-title"
          className="fixed inset-0 z-50 m-0 flex h-full w-full max-h-none max-w-none items-center justify-center border-none bg-slate-950/60 p-4 backdrop-blur-xs font-['Geist']"
        >
          {/* Backdrop button for closing on outside click */}
          <button
            type="button"
            aria-label="Close dialog backdrop"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 h-full w-full bg-transparent cursor-default -z-10"
          />

          <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-2xl transition-all">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-muted hover:text-heading transition-colors cursor-pointer p-1"
              aria-label="Close dialog"
            >
              <svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {renderDialogBody()}
          </div>
        </dialog>
      )}
    </div>
  );
}
