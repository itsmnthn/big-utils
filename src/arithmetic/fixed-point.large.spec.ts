import { describe, expect, it } from 'vitest'
import { bigPow10 } from '../core/index'
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

const pow10 = (d: number) => bigPow10(d)

// ------------------------ bigMulDivTrunc (large) ------------------------
describe('bigMulDivTrunc — large magnitudes', () => {
  it('matches naive truncation with ~1e12 operands', () => {
    const a = 987_654_321_987n
    const b = 1_234_567_890_123n
    const d = 123_456_789n
    const expected = (a * b) / d // trunc toward 0
    expect(bigMulDivTrunc(a, b, d)).toBe(expected)
  })

  it('handles mixed signs with large operands', () => {
    const a = -999_999_999_937n
    const b = 1_000_000_123_457n
    const d = 2_000_000_007n
    const expected = (a * b) / d
    expect(bigMulDivTrunc(a, b, d)).toBe(expected)
  })

  it('throws on d == 0', () => {
    expect(() => bigMulDivTrunc(1_000_000_001n, 1_000_000_003n, 0n)).toThrow(/division by zero/i)
  })
})

// ------------------------ bigMulDivRound (large + ties) -------------------
describe('bigMulDivRound — large magnitudes & exact ties', () => {
  it('positive tie with both multiplicands ≥ 1e6 (controls all half-modes)', () => {
    // Denominator (even and large)
    const den = 2n * 1_000_000n * 1_234_567n // 2 * 1e6 * k  ≈ 2.469e12
    // Build N = A*B so that N mod den == den/2 using:
    // Pick A = (den/2) * m, B = odd, with m ≡ 1 (mod den) → m = den + 1 (odd).
    // Then A >= 5e11, B >= 1e6 → both large.
    const m = den + 1n // odd
    const A = (den / 2n) * m // ~ (den/2)*(den+1)
    const B = 1_000_001n // odd and ≥ 1e6
    // Now A*B / den = q + 0.5 with q = (m*B - 1)/2
    const q = (m * B - 1n) / 2n

    expect(bigMulDivRound(A, B, den, ROUND_MODES.TRUNC)).toBe(q)
    expect(bigMulDivRound(A, B, den, ROUND_MODES.DOWN)).toBe(q)
    expect(bigMulDivRound(A, B, den, ROUND_MODES.UP)).toBe(q + 1n)
    expect(bigMulDivRound(A, B, den, ROUND_MODES.HALF_AWAY_ZERO)).toBe(q + 1n)
    expect(bigMulDivRound(A, B, den, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(q)
    // q is integer; parity controls HALF_EVEN:
    const isEven = (q & 1n) === 0n
    expect(bigMulDivRound(A, B, den, ROUND_MODES.HALF_EVEN)).toBe(isEven ? q : q + 1n)
    expect(bigMulDivRound(A, B, den, ROUND_MODES.HALF_FLOOR)).toBe(q)
    expect(bigMulDivRound(A, B, den, ROUND_MODES.HALF_CEILING)).toBe(q + 1n)
  })
})

// ------------------------ bigMulScaled (large) ----------------------------
describe('bigMulScaled — large magnitudes', () => {
  it('tRUNC matches manual for ~1e12-scaled operands (scale=6)', () => {
    const scale = 6
    const den = pow10(scale)
    // a ≈ 987,654.321000 ; b ≈ 1,234,567.890123
    const aScaled = 987_654_321_000n
    const bScaled = 1_234_567_890_123n
    const expected = (aScaled * bScaled) / den
    expect(bigMulScaled(aScaled, bScaled, scale, ROUND_MODES.TRUNC)).toBe(expected)
  })

  it('exact tie at scale=6 with both operands ≥ 1e6', () => {
    const scale = 6
    const den = pow10(scale) // 1_000_000
    // Construct A', B' so (A'*B') mod den == den/2 (see bigMulDivRound tie trick)
    const m = den + 1n // 1_000_001 (odd)
    const A = (den / 2n) * m // ~5e5 * 1_000_001 ≈ 5e11
    const B = 1_000_001n // ≥ 1e6
    const q = (m * B - 1n) / 2n

    expect(bigMulScaled(A, B, scale, ROUND_MODES.TRUNC)).toBe(q)
    expect(bigMulScaled(A, B, scale, ROUND_MODES.UP)).toBe(q + 1n)
    expect(bigMulScaled(A, B, scale, ROUND_MODES.HALF_AWAY_ZERO)).toBe(q + 1n)
    expect(bigMulScaled(A, B, scale, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(q)
    const isEven = (q & 1n) === 0n
    expect(bigMulScaled(A, B, scale, ROUND_MODES.HALF_EVEN)).toBe(isEven ? q : q + 1n)
  })
})

// ------------------------ bigDivScaled (large) ----------------------------
describe('bigDivScaled — large magnitudes', () => {
  it('tRUNC matches manual with ~1e12 numerator/denominator (scale=6)', () => {
    const scale = 6
    const aScaled = 999_999_999_999n // ~ 999_999.999999
    const bScaled = 1_234_567_890_123n
    const expected = (aScaled * pow10(scale)) / bScaled
    expect(bigDivScaled(aScaled, bScaled, scale, ROUND_MODES.TRUNC)).toBe(expected)
  })

  it('exact tie construction at scale=6 with both sides large', () => {
    // Make (aScaled * 10^scale) / bScaled = q + 0.5
    // Let bScaled = 2 * 10^scale * M, choose big M; then set aScaled = (2q + 1) * M.
    const scale = 6
    const base = pow10(scale)
    const M = 987_654_321n // ≥ 1e6
    const qEven = 1_234_568n // even q
    const qOdd = 1_234_567n // odd q

    const bScaled = 2n * base * M // ~ 1.975e12
    const aEven = (2n * qEven + 1n) * M // ≥ 1e12+
    const aOdd = (2n * qOdd + 1n) * M

    // For tie: result is q + 0.5 at integer grid
    expect(bigDivScaled(aEven, bScaled, scale, ROUND_MODES.TRUNC)).toBe(qEven)
    expect(bigDivScaled(aEven, bScaled, scale, ROUND_MODES.UP)).toBe(qEven + 1n)
    expect(bigDivScaled(aEven, bScaled, scale, ROUND_MODES.HALF_EVEN)).toBe(qEven) // even → stay

    expect(bigDivScaled(aOdd, bScaled, scale, ROUND_MODES.TRUNC)).toBe(qOdd)
    expect(bigDivScaled(aOdd, bScaled, scale, ROUND_MODES.HALF_EVEN)).toBe(qOdd + 1n) // odd → bump
  })

  it('throws if bScaled == 0', () => {
    expect(() => bigDivScaled(1_000_000_000_000n, 0n, 6, ROUND_MODES.TRUNC)).toThrow(/division by zero/i)
  })
})

// ------------------------ bigSqrtInt (large) -------------------------------
describe('bigSqrtInt — large magnitudes', () => {
  it('perfect square near 1e24', () => {
    const s = 1_000_000_000_000n // 1e12
    expect(bigSqrtInt(s * s)).toBe(s)
  })

  it('neighbor just below a large perfect square', () => {
    const s = 999_999_937_000n
    expect(bigSqrtInt(s * s - 1n)).toBe(s - 1n)
  })
})

// ------------------------ bigSqrtScaled (large) ----------------------------
describe('bigSqrtScaled — large magnitudes', () => {
  it('exact square at scale=9: sqrt(1.0) == 1.0 (value=1e9)', () => {
    const scale = 9
    const base = pow10(scale) // 1e9
    const xScaled = base // 1.000000000 at 1e9
    expect(bigSqrtScaled(xScaled, scale, ROUND_MODES.TRUNC)).toBe(base)
    expect(bigSqrtScaled(xScaled, scale, ROUND_MODES.UP)).toBe(base)
  })

  it('nearest behavior on a large non-square (13.0 @ scale=9)', () => {
    const scale = 9
    const base = pow10(scale)
    const xScaled = 13n * base
    const expectedSqrt = 3_605_551_275n // 3.605551275
    const expectedSqrtUp = 3_605_551_276n // 3.605551276
    expect(bigSqrtScaled(xScaled, scale, ROUND_MODES.HALF_EVEN)).toBe(expectedSqrt)
    expect(bigSqrtScaled(xScaled, scale, ROUND_MODES.DOWN)).toBe(expectedSqrt)
    expect(bigSqrtScaled(xScaled, scale, ROUND_MODES.UP)).toBe(expectedSqrtUp)
  })
})

// ------------------------ bigPowIntScaled (large) --------------------------
describe('bigPowIntScaled — large magnitudes', () => {
  it('exp=0 returns 10^scale for any large base', () => {
    const scale = 6
    const baseScaled = 987_654_321_000n
    expect(bigPowIntScaled(baseScaled, 0n, scale, ROUND_MODES.HALF_EVEN)).toBe(pow10(scale))
  })

  it('positive exponent with large base (scale=6)', () => {
    // ~ (1234.567890)^2 at scale=6
    const scale = 6
    const baseScaled = 1_234_567_890_000n // 1_234.567890
    const squaredViaPow = bigPowIntScaled(baseScaled, 2n, scale, ROUND_MODES.HALF_EVEN)
    const viaMul = bigMulScaled(baseScaled, baseScaled, scale, ROUND_MODES.HALF_EVEN)
    expect(squaredViaPow).toBe(viaMul)
  })

  it('negative exponent produces reciprocal for large base', () => {
    const scale = 6
    const baseScaled = 2_000_000n // 2.000000 (≥ 1e6 scaled)
    // 2^-1 = 0.5 → 0.5 * 1e6 = 500_000
    expect(bigPowIntScaled(baseScaled, -1n, scale, ROUND_MODES.HALF_AWAY_ZERO)).toBe(500_000n)
  })

  it('0^(-1) still throws via reciprocal path', () => {
    const scale = 9
    expect(() => bigPowIntScaled(0n, -1n, scale, ROUND_MODES.TRUNC)).toThrow(/division by zero/i)
  })
})
