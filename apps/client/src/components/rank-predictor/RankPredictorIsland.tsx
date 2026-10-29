import React, { useState, useId } from 'react';

interface ExamConfig {
  id: string;
  name: string;
  totalMarks: number;
  expectedAspirants: number;
  cutoffs: Record<string, number>;
  historicalData: Array<{ year: number; categoryCutoffs: Record<string, number> }>;
}

const EXAM_PRESETS: ExamConfig[] = [
  {
    id: 'ssc-cgl-tier1',
    name: 'SSC CGL (Tier 1)',
    totalMarks: 200,
    expectedAspirants: 320000,
    cutoffs: {
      UR: 148,
      OBC: 143,
      EWS: 139,
      SC: 124,
      ST: 115,
      PwBD: 90,
    },
    historicalData: [
      { year: 2024, categoryCutoffs: { UR: 153.2, OBC: 147.8, EWS: 144.1, SC: 128.5, ST: 119.2 } },
      { year: 2023, categoryCutoffs: { UR: 150.0, OBC: 145.9, EWS: 143.4, SC: 126.7, ST: 118.1 } },
      { year: 2022, categoryCutoffs: { UR: 114.2, OBC: 102.3, EWS: 102.3, SC: 89.1, ST: 77.5 } },
    ],
  },
  {
    id: 'rrb-ntpc-cbt1',
    name: 'RRB NTPC (CBT 1)',
    totalMarks: 100,
    expectedAspirants: 850000,
    cutoffs: {
      UR: 76,
      OBC: 71,
      EWS: 68,
      SC: 62,
      ST: 55,
      PwBD: 45,
    },
    historicalData: [
      { year: 2024, categoryCutoffs: { UR: 78.4, OBC: 73.1, EWS: 70.2, SC: 64.5, ST: 58.2 } },
      { year: 2021, categoryCutoffs: { UR: 74.0, OBC: 68.8, EWS: 66.5, SC: 60.1, ST: 53.4 } },
    ],
  },
  {
    id: 'ibps-po-prelims',
    name: 'IBPS PO (Prelims)',
    totalMarks: 100,
    expectedAspirants: 240000,
    cutoffs: {
      UR: 56,
      OBC: 54,
      EWS: 52,
      SC: 46,
      ST: 41,
      PwBD: 32,
    },
    historicalData: [
      { year: 2024, categoryCutoffs: { UR: 58.5, OBC: 56.0, EWS: 54.5, SC: 48.0, ST: 43.5 } },
      { year: 2023, categoryCutoffs: { UR: 54.2, OBC: 54.2, EWS: 54.2, SC: 46.5, ST: 39.0 } },
    ],
  },
  {
    id: 'sbi-clerk-prelims',
    name: 'SBI Clerk (Prelims)',
    totalMarks: 100,
    expectedAspirants: 520000,
    cutoffs: {
      UR: 72,
      OBC: 69,
      EWS: 67,
      SC: 60,
      ST: 53,
      PwBD: 44,
    },
    historicalData: [
      { year: 2024, categoryCutoffs: { UR: 74.5, OBC: 71.2, EWS: 69.0, SC: 62.5, ST: 55.0 } },
      { year: 2023, categoryCutoffs: { UR: 71.0, OBC: 68.5, EWS: 66.0, SC: 59.0, ST: 51.5 } },
    ],
  },
];

const CATEGORIES = ['UR', 'OBC', 'EWS', 'SC', 'ST', 'PwBD'] as const;

export function RankPredictorIsland() {
  const examSelectId = useId();
  const categorySelectId = useId();
  const rawScoreInputId = useId();

  const [selectedExamId, setSelectedExamId] = useState(EXAM_PRESETS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [rawScore, setRawScore] = useState<string>('142');
  const [hasCalculated, setHasCalculated] = useState(true);

  const currentExam = EXAM_PRESETS.find((x) => x.id === selectedExamId) || EXAM_PRESETS[0];
  const maxMarks = currentExam.totalMarks;

  const numericScore = Math.max(0, Math.min(maxMarks, Number.parseFloat(rawScore) || 0));
  const expectedCutoff = currentExam.cutoffs[selectedCategory] || 100;

  const scorePercent = (numericScore / maxMarks) * 100;
  const cutoffPercent = (expectedCutoff / maxMarks) * 100;

  // Statistical Normal Distribution approximation for AIR & Percentile
  const mean = maxMarks * 0.42;
  const stdDev = maxMarks * 0.16;
  const zScore = (numericScore - mean) / stdDev;

  const normCdf = (z: number) => {
    const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
    const d = 0.3989423 * Math.exp((-z * z) / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return z > 0 ? 1.0 - p : p;
  };

  const rawPercentile = Math.min(99.98, Math.max(1.0, normCdf(zScore) * 100));
  const formattedPercentile = rawPercentile.toFixed(2);

  const totalAspirants = currentExam.expectedAspirants;
  const estimatedRank = Math.max(1, Math.round(totalAspirants * (1 - rawPercentile / 100)));
  const minRank = Math.max(1, Math.round(estimatedRank * 0.85));
  const maxRank = Math.round(estimatedRank * 1.2);

  const delta = numericScore - expectedCutoff;
  let probability = 50;
  if (delta >= 15) probability = 98;
  else if (delta >= 10) probability = 94;
  else if (delta >= 5) probability = 85;
  else if (delta >= 0) probability = 68;
  else if (delta >= -5) probability = 42;
  else if (delta >= -10) probability = 22;
  else probability = 8;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8">
      {/* Input Card */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-bold text-heading">
          Enter Your Exam & Mock Test Score
        </h2>
        <p className="mt-1 text-xs text-muted">
          Our algorithm benchmarks your raw marks against historical cutoffs and standard percentile curves.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Exam Selection */}
          <div>
            <label htmlFor={examSelectId} className="block text-xs font-semibold text-heading">
              Target Examination
            </label>
            <select
              id={examSelectId}
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                const nextExam = EXAM_PRESETS.find((x) => x.id === e.target.value) || EXAM_PRESETS[0];
                setRawScore(String(Math.round(nextExam.totalMarks * 0.72)));
              }}
              className="mt-1.5 w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-medium text-heading outline-none focus:border-accent"
            >
              {EXAM_PRESETS.map((exam) => (
                <option key={exam.id} value={exam.id}>
                  {exam.name} ({exam.totalMarks} Marks)
                </option>
              ))}
            </select>
          </div>

          {/* Category Selection */}
          <div>
            <label htmlFor={categorySelectId} className="block text-xs font-semibold text-heading">
              Reservation Category
            </label>
            <select
              id={categorySelectId}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-medium text-heading outline-none focus:border-accent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'UR' ? 'UR / General' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Raw Score */}
          <div>
            <label htmlFor={rawScoreInputId} className="block text-xs font-semibold text-heading">
              Your Raw / Mock Marks (Max: {maxMarks})
            </label>
            <div className="relative mt-1.5">
              <input
                id={rawScoreInputId}
                type="number"
                min="0"
                max={maxMarks}
                step="0.25"
                value={rawScore}
                onChange={(e) => {
                  setRawScore(e.target.value);
                  setHasCalculated(true);
                }}
                className="w-full rounded-xl border border-border bg-canvas px-3 py-2.5 text-xs font-bold text-heading outline-none focus:border-accent"
              />
              <span className="absolute right-3 top-2.5 text-xs text-muted font-mono">/ {maxMarks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RESULT & PREDICTION DASHBOARD */}
      {hasCalculated && (
        <div className="space-y-6">
          {/* Hero Predictor Output */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {/* Predicted AIR Bracket */}
              <div className="rounded-xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold text-muted">Projected All-India Rank (AIR)</p>
                <p className="mt-2 text-2xl font-black text-accent">
                  {minRank.toLocaleString('en-IN')} – {maxRank.toLocaleString('en-IN')}
                </p>
                <p className="mt-1 text-[11px] text-muted">
                  Among {totalAspirants.toLocaleString('en-IN')}+ estimated candidates
                </p>
              </div>

              {/* Estimated Percentile */}
              <div className="rounded-xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold text-muted">Estimated Percentile</p>
                <p className="mt-2 text-2xl font-black text-heading">
                  {formattedPercentile}%
                </p>
                <p className="mt-1 text-[11px] text-success font-semibold">
                  Top {(100 - Number.parseFloat(formattedPercentile)).toFixed(2)}% of test takers
                </p>
              </div>

              {/* Qualifying Probability */}
              <div className="rounded-xl border border-border bg-canvas p-4">
                <p className="text-xs font-semibold text-muted">Cut-Off Clearance Chance</p>
                <div className="mt-2 flex items-center gap-2">
                  <p
                    className={`text-2xl font-black ${
                      probability >= 80
                        ? 'text-success'
                        : probability >= 50
                        ? 'text-accent'
                        : 'text-error'
                    }`}
                  >
                    {probability}%
                  </p>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      probability >= 80
                        ? 'bg-success/15 text-success'
                        : probability >= 50
                        ? 'bg-accent-soft text-accent'
                        : 'bg-error/15 text-error'
                    }`}
                  >
                    {probability >= 80 ? 'Very High' : probability >= 50 ? 'Moderate' : 'Needs Practice'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-muted">
                  Expected {selectedCategory} Cutoff: ~{expectedCutoff}
                </p>
              </div>
            </div>

            {/* Score vs Cutoff Visual Slider */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex justify-between text-xs font-semibold text-heading">
                <span>Your Score: {numericScore}</span>
                <span>Expected {selectedCategory} Cutoff: {expectedCutoff}</span>
              </div>
              <div className="relative mt-2 h-2.5 w-full rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(5, scorePercent))}%` }}
                />
                <div
                  className="absolute top-[-3px] h-4 w-1 rounded-full bg-error"
                  style={{ left: `${Math.min(100, Math.max(5, cutoffPercent))}%` }}
                  title={`Cutoff: ${expectedCutoff}`}
                />
              </div>
            </div>
          </div>

          {/* Historical Cutoff Table */}
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <h3 className="text-base font-bold text-heading">
              Historical Official Cut-Off Trends ({currentExam.name})
            </h3>
            <p className="mt-1 text-xs text-muted">
              Official category cutoff marks from previous exam cycles.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border font-semibold text-muted">
                    <th className="py-2.5">Year</th>
                    <th className="py-2.5">UR</th>
                    <th className="py-2.5">OBC</th>
                    <th className="py-2.5">EWS</th>
                    <th className="py-2.5">SC</th>
                    <th className="py-2.5">ST</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-heading">
                  {currentExam.historicalData.map((h) => (
                    <tr key={h.year}>
                      <td className="py-2.5 font-bold text-heading">{h.year}</td>
                      <td className="py-2.5">{h.categoryCutoffs.UR ?? '—'}</td>
                      <td className="py-2.5">{h.categoryCutoffs.OBC ?? '—'}</td>
                      <td className="py-2.5">{h.categoryCutoffs.EWS ?? '—'}</td>
                      <td className="py-2.5">{h.categoryCutoffs.SC ?? '—'}</td>
                      <td className="py-2.5">{h.categoryCutoffs.ST ?? '—'}</td>
                    </tr>
                  ))}
                  <tr className="bg-accent-soft font-bold text-heading">
                    <td className="py-2.5">2026 (Expected)</td>
                    <td className="py-2.5">~{currentExam.cutoffs.UR}</td>
                    <td className="py-2.5">~{currentExam.cutoffs.OBC}</td>
                    <td className="py-2.5">~{currentExam.cutoffs.EWS}</td>
                    <td className="py-2.5">~{currentExam.cutoffs.SC}</td>
                    <td className="py-2.5">~{currentExam.cutoffs.ST}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Nudge */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface-raised p-5">
            <div>
              <h4 className="text-sm font-bold text-heading">
                Want to confirm your standing with real test takers?
              </h4>
              <p className="mt-1 text-xs text-muted">
                Take our full-length TCS iON mock test series with instant percentile and sectional reports.
              </p>
            </div>
            <a
              href="/test-series"
              className="rounded-xl bg-accent hover:bg-accent-hover px-5 py-2.5 text-xs font-bold text-on-accent transition-colors shadow-xs"
            >
              Explore Full Mock Tests →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
