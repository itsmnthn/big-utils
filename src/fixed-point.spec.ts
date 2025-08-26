import { describe, expect, it } from 'vitest'
import { bigPow10 } from './core'
import {
  bigDivScaled,
  bigMulDivRound,
  bigMulDivTrunc,
  bigMulScaled,
  bigPowIntScaled,
  bigSqrtInt,
  bigSqrtScaled,
} from './fixed-point'
import { ROUND_MODES } from './rounding'

// --------------------------- bigMulDivTrunc ---------------------------
describe('bigMulDivTrunc', () => {
  it('basic positives', () => {
    expect(bigMulDivTrunc(1000n, 3n, 2n)).toBe(1500n)
    expect(bigMulDivTrunc(7n, 5n, 3n)).toBe((7n * 5n) / 3n) // trunc toward 0
  })

  it('negatives (signs across args)', () => {
    expect(bigMulDivTrunc(-7n, 5n, 2n)).toBe((-7n * 5n) / 2n) // -17
    expect(bigMulDivTrunc(7n, -5n, 2n)).toBe((7n * -5n) / 2n) // -17
    expect(bigMulDivTrunc(-7n, -5n, 2n)).toBe((-7n * -5n) / 2n) // 17
  })

  it('uses GCD reductions (result equals naive expression)', () => {
    const a = 123456789012345678901n
    const b = 987654321987654321n
    const d = 3n * 7n * 11n // plenty of reduction opportunities
    expect(bigMulDivTrunc(a, b, d)).toBe((a * b) / d)
  })

  it('throws on d == 0', () => {
    expect(() => bigMulDivTrunc(1n, 2n, 0n)).toThrow(/division by zero/i)
  })
})

// --------------------------- bigMulDivRound ---------------------------
describe('bigMulDivRound', () => {
  it('respects rounding modes at exact tie (5/2 = 2.5)', () => {
    // Use a=1, b=5, d=2 → 2.5 exact tie
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.TRUNC)).toBe(2n)
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.DOWN)).toBe(2n)
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.UP)).toBe(3n)
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.HALF_AWAY_ZERO)).toBe(3n)
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(2n)
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.HALF_EVEN)).toBe(2n) // 2 is even
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.HALF_FLOOR)).toBe(2n)
    expect(bigMulDivRound(1n, 5n, 2n, ROUND_MODES.HALF_CEILING)).toBe(3n)
  })

  it('negative tie (-5/2 = -2.5)', () => {
    expect(bigMulDivRound(-1n, 5n, 2n, ROUND_MODES.HALF_AWAY_ZERO)).toBe(-3n)
    expect(bigMulDivRound(-1n, 5n, 2n, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(-2n)
    expect(bigMulDivRound(-1n, 5n, 2n, ROUND_MODES.HALF_EVEN)).toBe(-2n) // -2 is even
    expect(bigMulDivRound(-1n, 5n, 2n, ROUND_MODES.HALF_FLOOR)).toBe(-3n) // toward -∞
    expect(bigMulDivRound(-1n, 5n, 2n, ROUND_MODES.HALF_CEILING)).toBe(-2n) // toward +∞
  })

  it('nearest rounding when not a tie', () => {
    // 7/3 = 2 + 1/3 (< .5) → nearest 2
    expect(bigMulDivRound(7n, 1n, 3n, ROUND_MODES.HALF_EVEN)).toBe(2n)
    // 8/3 = 2 + 2/3 (> .5) → nearest 3
    expect(bigMulDivRound(8n, 1n, 3n, ROUND_MODES.HALF_EVEN)).toBe(3n)
    // negative
    expect(bigMulDivRound(-8n, 1n, 3n, ROUND_MODES.HALF_EVEN)).toBe(-3n)
  })

  it('throws on d == 0', () => {
    expect(() => bigMulDivRound(1n, 2n, 0n, ROUND_MODES.TRUNC)).toThrow(/division by zero/i)
  })
})

// --------------------------- bigMulScaled ---------------------------
describe('bigMulScaled', () => {
  it('simple product at scale=2: 1.23 * 2.00 → 2.46', () => {
    expect(bigMulScaled(123n, 200n, 2, ROUND_MODES.HALF_AWAY_ZERO)).toBe(246n)
  })

  it('tie at 0.125 (0.25 * 0.50) with scale=2 → 12.5 @ 2dp', () => {
    // aScaled*bScaled = 25*50 = 1250; denom=10^2=100 → 12.5 tie
    expect(bigMulScaled(25n, 50n, 2, ROUND_MODES.TRUNC)).toBe(12n)
    expect(bigMulScaled(25n, 50n, 2, ROUND_MODES.DOWN)).toBe(12n)
    expect(bigMulScaled(25n, 50n, 2, ROUND_MODES.UP)).toBe(13n)
    expect(bigMulScaled(25n, 50n, 2, ROUND_MODES.HALF_AWAY_ZERO)).toBe(13n)
    expect(bigMulScaled(25n, 50n, 2, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(12n)
    expect(bigMulScaled(25n, 50n, 2, ROUND_MODES.HALF_EVEN)).toBe(12n) // 12 even
  })

  it('negative product respects sign & rounding at tie (-0.25 * 0.50 = -0.125)', () => {
    expect(bigMulScaled(-25n, 50n, 2, ROUND_MODES.HALF_AWAY_ZERO)).toBe(-13n)
    expect(bigMulScaled(-25n, 50n, 2, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(-12n)
    expect(bigMulScaled(-25n, 50n, 2, ROUND_MODES.HALF_EVEN)).toBe(-12n)
  })
})

// --------------------------- bigDivScaled ---------------------------
describe('bigDivScaled', () => {
  it('basic: (1.00 / 3.00) @ scale=6', () => {
    const out = bigDivScaled(1_000_000n, 3_000_000n, 6, ROUND_MODES.TRUNC)
    expect(out).toBe(333333n)
  })

  it('tie at 0.5 when scale=0: (1.00 / 2.00) → 0.5', () => {
    const a = 1_000_000n
    const b = 2_000_000n
    expect(bigDivScaled(a, b, 0, ROUND_MODES.TRUNC)).toBe(0n)
    expect(bigDivScaled(a, b, 0, ROUND_MODES.DOWN)).toBe(0n)
    expect(bigDivScaled(a, b, 0, ROUND_MODES.UP)).toBe(1n)
    expect(bigDivScaled(a, b, 0, ROUND_MODES.HALF_AWAY_ZERO)).toBe(1n)
    expect(bigDivScaled(a, b, 0, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(0n)
    expect(bigDivScaled(a, b, 0, ROUND_MODES.HALF_EVEN)).toBe(0n) // 0 is even neighbor
  })

  it('negative numerator and denominator cases', () => {
    const a = -1_000_000n
    const b = 2_000_000n
    expect(bigDivScaled(a, b, 0, ROUND_MODES.HALF_AWAY_ZERO)).toBe(-1n) // -0.5 → away
    expect(bigDivScaled(a, b, 0, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(0n)
    expect(bigDivScaled(a, -b, 0, ROUND_MODES.HALF_AWAY_ZERO)).toBe(1n) // sign cancels
  })

  it('throws if bScaled == 0', () => {
    expect(() => bigDivScaled(1n, 0n, 6, ROUND_MODES.TRUNC)).toThrow(/division by zero/i)
  })
})

// --------------------------- bigSqrtInt ---------------------------
describe('bigSqrtInt', () => {
  it('basic values', () => {
    expect(bigSqrtInt(0n)).toBe(0n)
    expect(bigSqrtInt(1n)).toBe(1n)
    expect(bigSqrtInt(2n)).toBe(1n)
    expect(bigSqrtInt(3n)).toBe(1n)
    expect(bigSqrtInt(4n)).toBe(2n)
    expect(bigSqrtInt(15n)).toBe(3n)
    expect(bigSqrtInt(16n)).toBe(4n)
  })

  it('large perfect square and neighbor', () => {
    const x = 10n ** 24n
    expect(bigSqrtInt(x)).toBe(10n ** 12n)
    expect(bigSqrtInt(x - 1n)).toBe(10n ** 12n - 1n)
  })

  it('throws for negative input', () => {
    expect(() => bigSqrtInt(-1n)).toThrow(/≥ 0/)
  })
})

// --------------------------- bigSqrtScaled ---------------------------
describe('bigSqrtScaled', () => {
  it('perfect square at scale=2: sqrt(1.44) → 1.20 (→ 120)', () => {
    expect(bigSqrtScaled(144n, 2, ROUND_MODES.TRUNC)).toBe(120n)
    expect(bigSqrtScaled(144n, 2, ROUND_MODES.UP)).toBe(120n) // exact square → same
  })

  it('non-square, scale=0: sqrt(10) ≈ 3.162... (TRUNC 3, UP 4)', () => {
    expect(bigSqrtScaled(10n, 0, ROUND_MODES.TRUNC)).toBe(3n)
    expect(bigSqrtScaled(10n, 0, ROUND_MODES.UP)).toBe(4n)
    // nearest modes choose the closest square root:
    expect(bigSqrtScaled(10n, 0, ROUND_MODES.HALF_EVEN)).toBe(3n) // closer to 3
  })

  it('nearest chooses next when closer to next^2 (scale=0, x=13)', () => {
    // squares: 3^2=9, 4^2=16; 13 is closer to 16 → 4 for nearest modes
    expect(bigSqrtScaled(13n, 0, ROUND_MODES.HALF_EVEN)).toBe(4n)
    expect(bigSqrtScaled(13n, 0, ROUND_MODES.HALF_AWAY_ZERO)).toBe(4n)
    expect(bigSqrtScaled(13n, 0, ROUND_MODES.HALF_FLOOR)).toBe(4n) // tie logic unreachable; nearest applies
    expect(bigSqrtScaled(13n, 0, ROUND_MODES.HALF_CEILING)).toBe(4n)
    expect(bigSqrtScaled(13n, 0, ROUND_MODES.DOWN)).toBe(3n)
    expect(bigSqrtScaled(13n, 0, ROUND_MODES.UP)).toBe(4n)
  })

  it('zero input yields zero at any mode', () => {
    expect(bigSqrtScaled(0n, 6, ROUND_MODES.HALF_EVEN)).toBe(0n)
  })

  it('throws for negative xScaled', () => {
    expect(() => bigSqrtScaled(-1n, 2, ROUND_MODES.TRUNC)).toThrow(/≥ 0/)
  })
})

// --------------------------- bigPowIntScaled ---------------------------
describe('bigPowIntScaled', () => {
  it('exp=0 returns 1.0 at scale (10^scale)', () => {
    expect(bigPowIntScaled(12345n, 0n, 4, ROUND_MODES.HALF_AWAY_ZERO)).toBe(bigPow10(4))
  })

  it('positive exponent (1.05^3 @ scale=4) ≈ 1.1576 → 11576', () => {
    const base = 10500n // 1.0500
    const out = bigPowIntScaled(base, 3n, 4, ROUND_MODES.HALF_AWAY_ZERO)
    expect(out).toBe(11576n)
  })

  it('negative exponent is reciprocal (2.00^-1 @ scale=2) → 0.50 → 50', () => {
    const base = 200n // 2.00
    const out = bigPowIntScaled(base, -1n, 2, ROUND_MODES.HALF_AWAY_ZERO)
    expect(out).toBe(50n)
  })

  it('chaining squares matches repeated mul (1.10^2 @ scale=2)', () => {
    const base = 110n // 1.10
    const squaredViaPow = bigPowIntScaled(base, 2n, 2, ROUND_MODES.HALF_EVEN)
    const viaMul = bigMulScaled(base, base, 2, ROUND_MODES.HALF_EVEN)
    expect(squaredViaPow).toBe(viaMul)
  })

  it('base < 1 shrinks for positive exponent; grows for negative exponent', () => {
    const base = 95_00n // 0.9500 @ scale=4
    const pos = bigPowIntScaled(base, 3n, 4, ROUND_MODES.HALF_EVEN)
    const neg = bigPowIntScaled(base, -3n, 4, ROUND_MODES.HALF_EVEN)
    expect(pos).toBeLessThan(bigPow10(4)) // < 1.0000
    expect(neg).toBeGreaterThan(bigPow10(4)) // > 1.0000
  })

  it('0^k (k>0) → 0; 0^0 → 1; 0^(-1) throws via reciprocal division', () => {
    const s = 4
    expect(bigPowIntScaled(0n, 3n, s, ROUND_MODES.TRUNC)).toBe(0n)
    expect(bigPowIntScaled(0n, 0n, s, ROUND_MODES.TRUNC)).toBe(bigPow10(s)) // 1.0000
    expect(() => bigPowIntScaled(0n, -1n, s, ROUND_MODES.TRUNC)).toThrow(/division by zero/i)
  })
})
