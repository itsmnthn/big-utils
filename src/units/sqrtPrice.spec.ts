import { describe, expect, it } from 'vitest'
import { ROUND_MODES } from '../arithmetic/index'
import { bigPriceFromSqrt, bigPriceFromSqrtQ64, bigPriceFromSqrtQ96 } from './sqrtPrice'

// handy constants
const TWO64 = 1n << 64n
const TWO96 = 1n << 96n

describe('bigPriceFromSqrtQ64 — success cases', () => {
  it('should be equal to move module', () => {
    expect(bigPriceFromSqrtQ64(3860534275239885696n, 2, 8, ROUND_MODES.HALF_AWAY_ZERO)).toBe(437981110n)
  })

  it('sqrt=0 -> price=0 for any k/outScale', () => {
    expect(bigPriceFromSqrtQ64(0n, 0, 0, ROUND_MODES.TRUNC)).toBe(0n)
    expect(bigPriceFromSqrtQ64(0n, 6, 8, ROUND_MODES.HALF_AWAY_ZERO)).toBe(0n)
    expect(bigPriceFromSqrtQ64(0n, -6, 18, ROUND_MODES.HALF_EVEN)).toBe(0n)
  })

  it('anchor: sqrt=2^64 -> price=10^k (scaled by outScale)', () => {
    // k = 0  => price = 1
    expect(bigPriceFromSqrtQ64(TWO64, 0, 8, ROUND_MODES.TRUNC)).toBe(100000000n)
    // k = +2 => price = 100
    expect(bigPriceFromSqrtQ64(TWO64, 2, 6, ROUND_MODES.TRUNC)).toBe(100n * 1000000n)
    // k = -2 => price = 0.01
    expect(bigPriceFromSqrtQ64(TWO64, -2, 8, ROUND_MODES.TRUNC)).toBe(1000000n)
  })

  it('monotonicity: increasing sqrt increases price', () => {
    const a = (TWO64 * 3n) / 2n // 1.5 in Q64
    const b = (TWO64 * 5n) / 3n // ~1.666... in Q64
    const pa = bigPriceFromSqrtQ64(a, 0, 8, ROUND_MODES.TRUNC)
    const pb = bigPriceFromSqrtQ64(b, 0, 8, ROUND_MODES.TRUNC)
    expect(pb > pa).toBe(true)
  })

  it('positive and negative decimalsDelta (k) work', () => {
    const s = (TWO64 * 1234567n) / 1_000_000n // ~1.234567 in Q64
    const out8 = (k: number) => bigPriceFromSqrtQ64(s, k, 8, ROUND_MODES.TRUNC)
    // k=0 baseline
    const base = out8(0)

    // k = +3: out(3) = base*1000 + floor(1000 * frac(A)) ∈ [base*1000, base*1000+999]
    const up = out8(3)
    expect(up >= base * 1000n).toBe(true)
    expect(up <= base * 1000n + 999n).toBe(true)
    // k=-3 ≈ ÷1000 (trunc)
    expect(out8(-3)).toBe(base / 1000n)
  })

  it('rounding modes produce consistent direction relative to trunc', () => {
    const s = (TWO64 * 10_001n) / 10_000n // ~1.0001
    const trunc = bigPriceFromSqrtQ64(s, 0, 8, ROUND_MODES.TRUNC)
    const hup = bigPriceFromSqrtQ64(s, 0, 8, ROUND_MODES.HALF_AWAY_ZERO)
    const hev = bigPriceFromSqrtQ64(s, 0, 8, ROUND_MODES.HALF_EVEN)
    // half_* are >= trunc (they may equal trunc if fraction < 0.5 ulp)
    expect(hup >= trunc).toBe(true)
    expect(hev >= trunc).toBe(true)
  })
})

describe('bigPriceFromSqrtQ96 — success cases', () => {
  it('anchor: sqrt=2^96 -> price=10^k (scaled)', () => {
    expect(bigPriceFromSqrtQ96(TWO96, 0, 8, ROUND_MODES.TRUNC)).toBe(100000000n)
    expect(bigPriceFromSqrtQ96(TWO96, 1, 6, ROUND_MODES.TRUNC)).toBe(10n * 1000000n)
  })

  it('basic non-trivial value', () => {
    const s = (TWO96 * 7n) / 5n // 1.4
    const p = bigPriceFromSqrtQ96(s, -2, 8, ROUND_MODES.TRUNC) // ~ (1.4^2)*0.01 * 1e8
    expect(p > 0n).toBe(true)
  })
})

describe('bigPriceFromSqrt (generic Qbits) — success & parity', () => {
  it('matches Q64 wrapper when sqrtBits=64', () => {
    const s = (TWO64 * 34567n) / 10000n
    const a = bigPriceFromSqrt(s, 64, 2, 8, ROUND_MODES.TRUNC)
    const b = bigPriceFromSqrtQ64(s, 2, 8, ROUND_MODES.TRUNC)
    expect(a).toBe(b)
  })

  it('matches Q96 wrapper when sqrtBits=96', () => {
    const s = (TWO96 * 23456n) / 10000n
    const a = bigPriceFromSqrt(s, 96, -3, 6, ROUND_MODES.TRUNC)
    const b = bigPriceFromSqrtQ96(s, -3, 6, ROUND_MODES.TRUNC)
    expect(a).toBe(b)
  })
})

describe('bigPriceFromSqrt — edge cases', () => {
  it('very small sqrt yields small price (handles underflow toward zero)', () => {
    const tiny = TWO64 / (1_000_000_000n) // 1e-9 in Q64
    const p = bigPriceFromSqrtQ64(tiny, 0, 18, ROUND_MODES.TRUNC)
    expect(p).toBe(0n) // squared is ~1e-18, but trunc to integer at 18 dp could be zero
  })

  it('very large sqrt doesn’t throw (arbitrary BigInt)', () => {
    const s = TWO64 * 10_000_000n
    const p = bigPriceFromSqrtQ64(s, 0, 8, ROUND_MODES.TRUNC)
    expect(p > 0n).toBe(true)
  })

  it('large positive/negative decimalsDelta within pow10 guard', () => {
    const s = TWO64
    expect(() => bigPriceFromSqrtQ64(s, 100, 10, ROUND_MODES.TRUNC)).not.toThrow()
    expect(() => bigPriceFromSqrtQ64(s, -100, 10, ROUND_MODES.TRUNC)).not.toThrow()
  })
})

describe('bigPriceFromSqrt — input validation / failures', () => {
  it('rejects negative sqrt', () => {
    expect(() => bigPriceFromSqrtQ64(-1n as unknown as bigint, 0, 8, ROUND_MODES.TRUNC)).toThrow(/non-negative/i)
  })

  it('rejects non-positive sqrtBits', () => {
    expect(() => bigPriceFromSqrt(123n, 0, 0, 8, ROUND_MODES.TRUNC)).toThrow(/sqrtBits must be a positive integer/i)
    expect(() => bigPriceFromSqrt(123n, -64 as unknown as number, 0, 8, ROUND_MODES.TRUNC)).toThrow()
  })

  it('rejects non-integer sqrtBits', () => {
    expect(() => bigPriceFromSqrt(123n, 64.5 as unknown as number, 0, 8, ROUND_MODES.TRUNC)).toThrow(/positive integer/i)
  })

  it('rejects negative outScale', () => {
    expect(() => bigPriceFromSqrtQ64(TWO64, 0, -1 as unknown as number, ROUND_MODES.TRUNC)).toThrow(/outScale must be a non-negative integer/i)
  })

  it('pow10 guard: throws if |k + outScale| exceeds limit (>= 2001)', () => {
    // For k >= 0 path: bigPow10(k + outScale)
    expect(() => bigPriceFromSqrtQ64(TWO64, 2001, 0, ROUND_MODES.TRUNC)).toThrow(/exponent must be ≤ 2000/i)
    expect(() => bigPriceFromSqrtQ64(TWO64, 0, 2001, ROUND_MODES.TRUNC)).toThrow(/exponent must be ≤ 2000/i)

    // For k < 0 path: bigPow10(-k) used on denominator
    expect(() => bigPriceFromSqrtQ64(TWO64, -2001, 0, ROUND_MODES.TRUNC)).toThrow(/exponent must be ≤ 2000/i)
  })
})
