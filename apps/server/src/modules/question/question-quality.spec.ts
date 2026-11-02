import { describe, expect, it } from 'vitest';
import { assessQuestionQuality } from './question-quality.js';

describe('assessQuestionQuality', () => {
  it('quarantines legacy Priyanka keystrokes instead of publishing them', () => {
    const result = assessQuestionQuality({
      content: 'SQL applies predicates in the clause.\nmecetn keâ ceW',
      options: [
        { content: 'HAVING', isCorrect: true },
        { content: 'GROUP BY', isCorrect: false },
      ],
      type: 'single_choice',
      subject: 'Computer Science',
      status: 'published',
    });
    expect(result.qualityFlags).toContain('legacy_keystrokes_in_english');
    expect(result.qualityStatus).toBe('needs_correction');
    expect(result.status).toBe('draft');
    expect(result.isAvailableForNewTests).toBe(false);
  });

  it('keeps a separated bilingual question available without marking it verified', () => {
    const result = assessQuestionQuality({
      content: 'After groups have been established, SQL applies predicates in the HAVING clause.',
      translations: { hi: 'समूह स्थापित होने के बाद, SQL खंड में विधेय लागू करता है।' },
      options: [
        { content: 'HAVING', isCorrect: true },
        { content: 'GROUP BY', isCorrect: false },
        { content: 'WITH', isCorrect: false },
        { content: 'More than one of the above', isCorrect: false },
      ],
      type: 'single_choice',
      subject: 'Computer Science',
      status: 'published',
    });
    expect(result.qualityStatus).toBe('extracted');
    expect(result.status).toBe('published');
    expect(result.isAvailableForNewTests).toBe(true);
  });
});
