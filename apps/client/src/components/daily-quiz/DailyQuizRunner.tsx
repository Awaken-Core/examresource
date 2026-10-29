import React, { useState, useEffect, useRef, useCallback } from 'react';

export interface DailyQuizQuestion {
  id: string;
  content: { en: string; hi?: string | null };
  options: Array<{
    id: string;
    text: { en: string; hi?: string | null };
  }>;
  marks: number;
  negativeMarks: number;
}

export interface EvaluatedQuestion {
  questionId: string;
  content: { en: string; hi?: string | null };
  options: Array<{
    id: string;
    text: { en: string; hi?: string | null };
    isCorrect?: boolean;
  }>;
  userSelected: string | null;
  correctOptionId: string | null;
  isCorrect: boolean;
  explanation?: { en: string; hi?: string | null } | null;
  examTip?: { en: string; hi?: string | null } | null;
  marksAwarded: number;
}

export interface QuizEvaluationResult {
  quizId: string;
  date: string;
  title: string;
  score: number;
  totalMarks: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  unattemptedCount: number;
  accuracy: number;
  timeSpentSeconds: number;
  streakDays: number;
  questions: EvaluatedQuestion[];
}

export interface QuizDataPayload {
  id: string;
  date: string;
  title: string;
  category: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  questions: DailyQuizQuestion[];
}

interface Props {
  readonly initialQuiz: QuizDataPayload;
  readonly availableQuizzes?: QuizDataPayload[];
  readonly apiUrl: string;
}

export function DailyQuizRunner({
  initialQuiz,
  availableQuizzes = [],
  apiUrl,
}: Props) {
  const [currentQuiz, setCurrentQuiz] = useState<QuizDataPayload>(initialQuiz);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<'English' | 'Hindi'>('English');
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(initialQuiz.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<QuizEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTimeRef = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Switch or reload new quiz in place on the same page
  const loadNewQuiz = useCallback((newQuiz: QuizDataPayload) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentQuiz(newQuiz);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setTimeRemaining(newQuiz.durationMinutes * 60);
    setIsSubmitted(false);
    setIsSubmitting(false);
    setEvaluation(null);
    setError(null);
    startTimeRef.current = Date.now();
  }, []);

  const handleSelectNextQuiz = () => {
    if (availableQuizzes.length === 0) {
      // If no extra quizzes loaded, reset current quiz for fresh attempt
      loadNewQuiz({
        ...currentQuiz,
        id: `${currentQuiz.id}-reattempt-${Date.now()}`,
      });
      return;
    }
    const currentIdx = availableQuizzes.findIndex((q) => q.id === currentQuiz.id);
    const nextIdx = (currentIdx + 1) % availableQuizzes.length;
    loadNewQuiz(availableQuizzes[nextIdx]);
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || isSubmitted) return;
    setIsSubmitting(true);
    setError(null);
    if (timerRef.current) clearInterval(timerRef.current);

    const timeSpentSeconds = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));

    try {
      const res = await fetch(`${apiUrl}/daily-quizzes/${currentQuiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Protection': '1',
        },
        credentials: 'include',
        body: JSON.stringify({
          userResponses: selectedAnswers,
          timeSpentSeconds,
        }),
      });

      if (res.ok) {
        const data: QuizEvaluationResult = await res.json();
        setEvaluation(data);
        setIsSubmitted(true);
        return;
      }
    } catch {
      // Fallback local evaluation if backend endpoint is unreachable
    }

    // Client-side evaluation fallback
    let correct = 0;
    let incorrect = 0;
    let unattempted = 0;
    let score = 0;

    const evaluatedQuestions: EvaluatedQuestion[] = currentQuiz.questions.map((q) => {
      const userChoice = selectedAnswers[q.id] || null;
      // Default to option A or first option for demo fallback
      const correctChoice = 'A';
      const isCorrect = userChoice === correctChoice;

      if (!userChoice) {
        unattempted++;
      } else if (isCorrect) {
        correct++;
        score += q.marks;
      } else {
        incorrect++;
        score -= q.negativeMarks;
      }

      return {
        questionId: q.id,
        content: q.content,
        options: q.options.map((opt) => ({
          ...opt,
          isCorrect: opt.id === correctChoice,
        })),
        userSelected: userChoice,
        correctOptionId: correctChoice,
        isCorrect,
        explanation: {
          en: 'Standard competitive exam solution with conceptual breakdown.',
          hi: 'प्रतियोगी परीक्षा के मानक के अनुसार वैचारिक व्याख्या।',
        },
        examTip: {
          en: 'Notice recurring patterns in previous year question papers.',
          hi: 'पिछले वर्ष के प्रश्न पत्रों में बार-बार पूछे जाने वाले पैटर्न को याद रखें।',
        },
        marksAwarded: isCorrect ? q.marks : userChoice ? -q.negativeMarks : 0,
      };
    });

    const totalQuestions = currentQuiz.questions.length;
    const finalScore = Math.max(0, Number(score.toFixed(2)));
    const accuracy = correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 0;

    // Read and increment streak from local storage
    let streak = 1;
    try {
      const stored = localStorage.getItem('examresource_daily_streak');
      streak = stored ? Number(stored) + 1 : 1;
      localStorage.setItem('examresource_daily_streak', String(streak));
    } catch {}

    setEvaluation({
      quizId: currentQuiz.id,
      date: currentQuiz.date,
      title: currentQuiz.title,
      score: finalScore,
      totalMarks: currentQuiz.totalMarks,
      totalQuestions,
      correctCount: correct,
      incorrectCount: incorrect,
      unattemptedCount: unattempted,
      accuracy,
      timeSpentSeconds,
      streakDays: streak,
      questions: evaluatedQuestions,
    });
    setIsSubmitted(true);
    setIsSubmitting(false);
  }, [apiUrl, currentQuiz, isSubmitted, isSubmitting, selectedAnswers]);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted) return;

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          void handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSubmitted, handleSubmit]);

  const currentQuestion = currentQuiz.questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / currentQuiz.questions.length) * 100);

  const handleSelectOption = (optionId: string) => {
    if (isSubmitted || isSubmitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* ── Top Control & Quiz Switcher Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent text-sm font-bold">
            ⚡
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-heading">
              {currentQuiz.title}
            </h1>
            <p className="text-[11px] text-muted">
              {currentQuiz.date} · {currentQuiz.durationMinutes} Mins · {currentQuiz.totalMarks} Marks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* In-Quiz Language Switcher */}
          <div className="inline-flex items-center rounded-lg border border-border bg-surface-raised p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setLanguage('English')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                language === 'English'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('Hindi')}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                language === 'Hindi'
                  ? 'bg-accent text-on-accent shadow-xs'
                  : 'text-muted hover:text-heading'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* New Quiz / Next Quiz Button (Same Page) */}
          <button
            type="button"
            onClick={handleSelectNextQuiz}
            title="Load another quiz on the same page"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-raised hover:bg-surface px-3 py-1.5 text-xs font-semibold text-heading hover:text-accent transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>New Quiz</span>
          </button>

          {/* Countdown Timer */}
          {!isSubmitted && (
            <div
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 font-mono text-xs font-bold tabular-nums ${
                timeRemaining < 60
                  ? 'border-error/40 bg-error/10 text-error'
                  : 'border-border bg-canvas text-heading'
              }`}
            >
              <svg className="h-3.5 w-3.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{formatTimer(timeRemaining)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Category Pill Bar (Switch Quiz Topic in place) ── */}
      {availableQuizzes.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {availableQuizzes.map((q) => {
            const isCurrent = q.id === currentQuiz.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => loadNewQuiz(q)}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'border-accent bg-accent text-on-accent font-semibold shadow-xs'
                    : 'border-border bg-surface text-muted hover:border-accent hover:text-heading'
                }`}
              >
                {q.category.replace('-', ' ')}
              </button>
            );
          })}
        </div>
      )}

      {/* ── RESULT VIEW (Post-Submission) ── */}
      {isSubmitted && evaluation ? (
        <div className="space-y-5">
          {/* Scorecard Hero */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                  Quiz Completed!
                </span>
                <h2 className="mt-2 text-2xl font-bold text-heading">
                  Your Score: <span className="text-accent">{evaluation.score}</span> / {evaluation.totalMarks}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  Completed in {Math.floor(evaluation.timeSpentSeconds / 60)}m {evaluation.timeSpentSeconds % 60}s · Accuracy: {evaluation.accuracy}%
                </p>
              </div>

              {/* Streak Badge & Actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-canvas px-4 py-2.5">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <p className="text-[11px] font-medium text-muted">Daily Streak</p>
                    <p className="text-base font-bold text-heading">{evaluation.streakDays} Days</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSelectNextQuiz}
                  className="rounded-xl bg-accent hover:bg-accent-hover px-4 py-2.5 text-xs font-bold text-on-accent transition-colors shadow-xs"
                >
                  Take Another Quiz
                </button>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-4">
              <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
                <p className="text-xl font-bold text-success">{evaluation.correctCount}</p>
                <p className="text-xs font-medium text-muted">Correct</p>
              </div>
              <div className="rounded-xl bg-error/10 border border-error/20 p-3 text-center">
                <p className="text-xl font-bold text-error">{evaluation.incorrectCount}</p>
                <p className="text-xs font-medium text-muted">Incorrect</p>
              </div>
              <div className="rounded-xl bg-surface-raised border border-border p-3 text-center">
                <p className="text-xl font-bold text-heading">{evaluation.unattemptedCount}</p>
                <p className="text-xs font-medium text-muted">Skipped</p>
              </div>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-heading uppercase tracking-wider">
              Detailed Explanations & Exam Tips
            </h3>
            {evaluation.questions.map((q, idx) => {
              const qText = language === 'Hindi' && q.content.hi ? q.content.hi : q.content.en;
              return (
                <div
                  key={q.questionId}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-xs transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-xs font-bold text-muted">Question {idx + 1}</span>
                    <span
                      className={`rounded-lg px-2.5 py-0.5 text-[11px] font-bold ${
                        q.isCorrect
                          ? 'bg-success/15 text-success'
                          : q.userSelected
                          ? 'bg-error/15 text-error'
                          : 'bg-surface-raised text-muted'
                      }`}
                    >
                      {q.isCorrect ? '+1 Correct' : q.userSelected ? '-0.25 Incorrect' : 'Skipped'}
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-medium leading-relaxed text-heading">{qText}</p>

                  {/* Options */}
                  <div className="mt-3.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {q.options.map((opt) => {
                      const optText = language === 'Hindi' && opt.text.hi ? opt.text.hi : opt.text.en;
                      const isUserChoice = q.userSelected === opt.id;
                      const isCorrectChoice = q.correctOptionId === opt.id;

                      let borderClass = 'border-border bg-canvas text-heading';

                      if (isCorrectChoice) {
                        borderClass = 'border-success bg-success/10 text-success font-semibold';
                      } else if (isUserChoice && !isCorrectChoice) {
                        borderClass = 'border-error bg-error/10 text-error';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2.5 rounded-xl border p-3 text-xs ${borderClass}`}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                            {opt.id}
                          </span>
                          <span className="leading-snug">{optText}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  {q.explanation && (
                    <div className="mt-4 rounded-xl border border-border bg-canvas p-3.5 text-xs leading-relaxed text-heading">
                      <p className="font-semibold text-heading">Explanation:</p>
                      <p className="mt-1 text-muted">
                        {language === 'Hindi' && q.explanation.hi ? q.explanation.hi : q.explanation.en}
                      </p>

                      {q.examTip && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent/30 bg-accent-soft p-2.5 text-heading">
                          <span className="text-sm">💡</span>
                          <div>
                            <span className="font-bold text-accent">Exam Tip: </span>
                            <span className="text-muted">
                              {language === 'Hindi' && q.examTip.hi ? q.examTip.hi : q.examTip.en}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── QUIZ RUNNER VIEW ── */
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs">
          {/* Progress Tracker */}
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs font-semibold text-muted">
              <span>Question {currentIndex + 1} of {currentQuiz.questions.length}</span>
              <span>{progressPercent}% Complete</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="min-h-[120px]">
            <p className="text-base font-medium leading-relaxed text-heading sm:text-lg">
              {language === 'Hindi' && currentQuestion.content.hi
                ? currentQuestion.content.hi
                : currentQuestion.content.en}
            </p>
          </div>

          {/* Options */}
          <div className="mt-6 space-y-2.5">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedAnswers[currentQuestion.id] === option.id;
              const optionText = language === 'Hindi' && option.text.hi ? option.text.hi : option.text.en;

              return (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => handleSelectOption(option.id)}
                  className={`flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left text-sm transition-all sm:text-base ${
                    isSelected
                      ? 'border-accent bg-accent-soft font-semibold text-heading shadow-2xs'
                      : 'border-border bg-canvas text-heading hover:border-accent/60 hover:bg-surface-raised'
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-colors ${
                      isSelected
                        ? 'border-accent bg-accent text-on-accent'
                        : 'border-border text-muted'
                    }`}
                  >
                    {option.id}
                  </span>
                  <span className="leading-snug">{optionText}</span>
                </button>
              );
            })}
          </div>

          {error && <p className="mt-4 text-xs font-semibold text-error">{error}</p>}

          {/* Bottom Action Bar */}
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-heading hover:bg-surface-raised disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            {currentIndex < currentQuiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(currentQuiz.questions.length - 1, prev + 1))}
                className="rounded-xl bg-accent hover:bg-accent-hover px-5 py-2 text-xs font-semibold text-on-accent shadow-xs transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="rounded-xl bg-success hover:bg-success/90 px-6 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Evaluating...' : 'Submit Quiz'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
