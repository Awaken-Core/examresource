/**
 * Structural checks for bilingual questions.
 * A question is not marked verified here. Low-confidence records stay out of
 * new test papers. Legacy Priyanka keystrokes are quarantined, not deleted.
 */

export type QualityStatus =
  | 'pending_review'
  | 'extracted'
  | 'needs_correction'
  | 'verified'
  | 'rejected';

const LEGACY_KEYSTROKE = /keâ|ceW|DeefO|efJe|nw~|GheÙ|keäle|Devegceefle/;
const DEVANAGARI = /[\u0900-\u097F]/;

export interface QualityInput {
  content?: string | null;
  translations?: Record<string, string> | null;
  explanation?: string | null;
  options?: Array<{ content?: string | null; translations?: Record<string, string> | null; isCorrect?: boolean }>;
  type?: string | null;
  subject?: string | null;
  blocks?: Array<Record<string, unknown>> | null;
  status?: 'draft' | 'published' | 'archived';
  qualityStatus?: QualityStatus;
}

export interface QualityResult {
  qualityStatus: QualityStatus;
  extractionConfidence: number;
  qualityFlags: string[];
  isAvailableForNewTests: boolean;
  status: 'draft' | 'published' | 'archived';
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export function assessQuestionQuality(input: QualityInput): QualityResult {
  const flags: string[] = [];
  const content = textOf(input.content);
  const hindi = textOf(input.translations?.hi);
  const options = input.options ?? [];
  const type = input.type || 'single_choice';

  if (!content.trim() && !hindi.trim()) flags.push('empty_stem');
  if (!content.trim()) flags.push('english_missing');
  if (LEGACY_KEYSTROKE.test(content) || options.some((option) => LEGACY_KEYSTROKE.test(textOf(option.content)))) {
    flags.push('legacy_keystrokes_in_english');
  }
  if (hindi && !DEVANAGARI.test(hindi)) flags.push('hindi_not_devanagari');
  if (LEGACY_KEYSTROKE.test(hindi)) flags.push('legacy_keystrokes_in_hindi');
  if (type !== 'numerical' && options.length < 2) flags.push('options_incomplete');
  if (type === 'single_choice' && options.filter((option) => option.isCorrect).length !== 1) {
    flags.push('answer_missing');
  }
  if (!textOf(input.subject)) flags.push('subject_missing');

  for (const block of input.blocks ?? []) {
    if (block.type !== 'table') continue;
    const rows = Array.isArray(block.rows) ? block.rows : [];
    const widths = new Set(
      rows.map((row) => (Array.isArray((row as { cells?: unknown[] }).cells) ? (row as { cells: unknown[] }).cells.length : 0)),
    );
    if (widths.size > 1) flags.push('table_ragged');
  }

  const penalties: Record<string, number> = {
    empty_stem: 0.7,
    english_missing: 0.25,
    legacy_keystrokes_in_english: 0.55,
    legacy_keystrokes_in_hindi: 0.45,
    hindi_not_devanagari: 0.35,
    options_incomplete: 0.4,
    answer_missing: 0.3,
    subject_missing: 0.1,
    table_ragged: 0.1,
  };
  let confidence = 1;
  for (const flag of new Set(flags)) confidence -= penalties[flag] ?? 0.05;
  confidence = Math.max(0, Math.round(confidence * 100) / 100);

  const requested = input.qualityStatus;
  let qualityStatus: QualityStatus;
  if (requested === 'verified' && flags.length === 0 && confidence >= 0.9) {
    qualityStatus = 'verified';
  } else if (requested === 'rejected') {
    qualityStatus = 'rejected';
  } else if (flags.some((flag) => flag.startsWith('legacy_') || flag === 'empty_stem' || flag === 'options_incomplete')) {
    qualityStatus = 'needs_correction';
  } else if (confidence >= 0.75) {
    qualityStatus = 'extracted';
  } else if (confidence >= 0.45) {
    qualityStatus = 'pending_review';
  } else {
    qualityStatus = 'needs_correction';
  }

  const blocked = qualityStatus === 'needs_correction' || qualityStatus === 'rejected' || qualityStatus === 'pending_review';
  const requestedStatus = input.status || 'draft';
  const status = blocked && requestedStatus === 'published' ? 'draft' : requestedStatus;

  return {
    qualityStatus,
    extractionConfidence: confidence,
    qualityFlags: [...new Set(flags)].sort(),
    isAvailableForNewTests: !blocked,
    status,
  };
}
