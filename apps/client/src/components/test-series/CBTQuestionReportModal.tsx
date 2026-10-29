import React, { useState } from 'react';
import { API_URL } from '../../lib/api';

interface Props {
  readonly isOpen: boolean;
  readonly questionId: string;
  readonly questionIndex: number;
  readonly onClose: () => void;
}

const ISSUE_REASONS = [
  'Incorrect Answer Key',
  'Typo or Formatting Glitch in Question',
  'Translation Discrepancy (Hindi vs English)',
  'Formula or Diagram Unreadable / Missing',
  'Ambiguous / Multiple Correct Answers',
  'Other Issue',
] as const;

export function CBTQuestionReportModal({
  isOpen,
  questionId,
  questionIndex,
  onClose,
}: Props) {
  const [selectedReason, setSelectedReason] = useState<string>(ISSUE_REASONS[0]);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!questionId || submitting) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`${API_URL}/questions/${questionId}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: selectedReason,
          details: details.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit report. Please try again.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDetails('');
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-error/10 text-error">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </span>
            <h3 id="report-modal-title" className="text-sm font-bold text-heading">
              Report Question {questionIndex + 1}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted hover:bg-surface-raised hover:text-heading transition-colors"
            aria-label="Close"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-heading">Report Submitted</p>
            <p className="mt-1 text-xs text-muted">
              Our academic editorial team will review and verify this question.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-heading">
                Select Issue Type
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-border bg-canvas px-3 py-2 text-xs text-heading outline-none focus:border-accent"
              >
                {ISSUE_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-heading">
                Additional Details (Optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Explain what is incorrect or unclear..."
                className="mt-1.5 w-full resize-none rounded-xl border border-border bg-canvas p-2.5 text-xs text-heading outline-none placeholder:text-muted focus:border-accent"
              />
            </div>

            {errorMessage && (
              <p className="text-xs text-error font-medium">{errorMessage}</p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-heading hover:bg-surface-raised transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-hover px-4.5 py-2 text-xs font-semibold text-on-accent transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
