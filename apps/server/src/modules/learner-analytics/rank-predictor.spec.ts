import { describe, expect, it } from 'vitest';

/**
 * Normal cumulative distribution function (error function approximation)
 * used in the Rank Predictor tool.
 */
function normCdf(z: number): number {
  const t = 1.0 / (1.0 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z > 0 ? 1.0 - p : p;
}

function calculateRankPrediction(rawScore: number, totalMarks: number, totalAspirants: number, cutoff: number) {
  const numericScore = Math.max(0, Math.min(totalMarks, rawScore));
  const mean = totalMarks * 0.42;
  const stdDev = totalMarks * 0.16;
  const zScore = (numericScore - mean) / stdDev;

  const rawPercentile = Math.min(99.98, Math.max(1.0, normCdf(zScore) * 100));
  const estimatedRank = Math.max(1, Math.round(totalAspirants * (1 - rawPercentile / 100)));
  const minRank = Math.max(1, Math.round(estimatedRank * 0.85));
  const maxRank = Math.round(estimatedRank * 1.2);

  const delta = numericScore - cutoff;
  let probability = 50;
  if (delta >= 15) probability = 98;
  else if (delta >= 10) probability = 94;
  else if (delta >= 5) probability = 85;
  else if (delta >= 0) probability = 68;
  else if (delta >= -5) probability = 42;
  else if (delta >= -10) probability = 22;
  else probability = 8;

  return {
    percentile: Number(rawPercentile.toFixed(2)),
    estimatedRank,
    minRank,
    maxRank,
    probability,
  };
}

describe('Rank Predictor Algorithm', () => {
  describe('Gaussian Percentile and Rank Projection', () => {
    it('calculates higher percentile for high score in SSC CGL (Tier 1)', () => {
      // 170 / 200 raw score with 320,000 aspirants
      const result = calculateRankPrediction(170, 200, 320000, 148);
      expect(result.percentile).toBeGreaterThan(99);
      expect(result.minRank).toBeLessThan(5000);
      expect(result.probability).toBe(98); // delta is +22 (>= 15)
    });

    it('calculates around 50th percentile for median score', () => {
      // 84 / 200 (exact mean is 42% = 84)
      const result = calculateRankPrediction(84, 200, 320000, 148);
      expect(result.percentile).toBeCloseTo(50, 0);
      expect(result.probability).toBe(8); // delta is negative (< -10)
    });

    it('calculates probability thresholds based on cut-off delta', () => {
      const cutoff = 70;
      // Exactly at cut-off -> 68% chance
      expect(calculateRankPrediction(70, 100, 500000, cutoff).probability).toBe(68);
      // 5 marks above cut-off -> 85% chance
      expect(calculateRankPrediction(75, 100, 500000, cutoff).probability).toBe(85);
      // 10 marks above cut-off -> 94% chance
      expect(calculateRankPrediction(80, 100, 500000, cutoff).probability).toBe(94);
      // 15 marks above cut-off -> 98% chance
      expect(calculateRankPrediction(85, 100, 500000, cutoff).probability).toBe(98);
      // 5 marks below cut-off -> 42% chance
      expect(calculateRankPrediction(65, 100, 500000, cutoff).probability).toBe(42);
      // 10 marks below cut-off -> 22% chance
      expect(calculateRankPrediction(60, 100, 500000, cutoff).probability).toBe(22);
      // More than 10 marks below cut-off -> 8% chance
      expect(calculateRankPrediction(50, 100, 500000, cutoff).probability).toBe(8);
    });

    it('ensures rank bounds are consistent (minRank <= maxRank)', () => {
      const result = calculateRankPrediction(142, 200, 320000, 148);
      expect(result.minRank).toBeLessThanOrEqual(result.maxRank);
      expect(result.minRank).toBeGreaterThanOrEqual(1);
    });
  });
});

