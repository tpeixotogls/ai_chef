import { describe, expect, it } from 'vitest';
import { isRecipeEligible } from '@/lib/matching-logic';

describe('isRecipeEligible', () => {
  it('returns eligible when all required items are present', () => {
    const result = isRecipeEligible(
      [
        { id: 'ing-1', optional: false },
        { id: 'ing-2', optional: true }
      ],
      [{ id: 'ut-1', optional: false }],
      new Set(['ing-1']),
      new Set(['ut-1'])
    );

    expect(result.eligible).toBe(true);
    expect(result.missingIngredients).toHaveLength(0);
    expect(result.missingUtensils).toHaveLength(0);
  });

  it('returns missing items when required items are absent', () => {
    const result = isRecipeEligible(
      [{ id: 'ing-1', optional: false }],
      [{ id: 'ut-1', optional: false }],
      new Set([]),
      new Set([])
    );

    expect(result.eligible).toBe(false);
    expect(result.missingIngredients).toHaveLength(1);
    expect(result.missingUtensils).toHaveLength(1);
  });
});
