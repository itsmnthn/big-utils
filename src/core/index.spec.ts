import { describe, expect, it } from 'vitest'
import { bigAbs, bigClamp, bigGcd, bigMax, bigMin, bigPow10, bigSign } from '.'

const TEN = 10n

describe('bigAbs', () => {
  it('returns same value for non-negative', () => {
    expect(bigAbs(0n)).toBe(0n)
    expect(bigAbs(5n)).toBe(5n)
  })
  it('negates for negative', () => {
    expect(bigAbs(-1n)).toBe(1n)
    expect(bigAbs(-999999999999999999n)).toBe(999999999999999999n)
  })
})

describe('bigClamp', () => {
  it('returns inside value unchanged', () => {
    expect(bigClamp(5n, 0n, 10n)).toBe(5n)
  })
  it('clamps below lower bound', () => {
    expect(bigClamp(-5n, 0n, 10n)).toBe(0n)
  })
  it('clamps above upper bound', () => {
    expect(bigClamp(15n, 0n, 10n)).toBe(10n)
  })
  it('works with negative ranges', () => {
    expect(bigClamp(-7n, -10n, -3n)).toBe(-7n)
    expect(bigClamp(-11n, -10n, -3n)).toBe(-10n)
    expect(bigClamp(-1n, -10n, -3n)).toBe(-3n)
  })
})

describe('bigMin / bigMax', () => {
  it('bigMin picks lesser; bigMax picks greater', () => {
    expect(bigMin(5n, 10n)).toBe(5n)
    expect(bigMin(-3n, -7n)).toBe(-7n)
    expect(bigMax(5n, 10n)).toBe(10n)
    expect(bigMax(-3n, -7n)).toBe(-3n)
  })
  it('are symmetric and idempotent on equals', () => {
    expect(bigMin(8n, 8n)).toBe(8n)
    expect(bigMax(8n, 8n)).toBe(8n)
    // symmetry
    expect(bigMin(3n, 9n)).toBe(bigMin(9n, 3n))
    expect(bigMax(3n, 9n)).toBe(bigMax(9n, 3n))
  })
})

describe('bigGcd', () => {
  it('handles basic cases and negatives', () => {
    expect(bigGcd(8n, 12n)).toBe(4n)
    expect(bigGcd(-8n, 12n)).toBe(4n)
    expect(bigGcd(8n, -12n)).toBe(4n)
    expect(bigGcd(-8n, -12n)).toBe(4n)
  })
  it('gcd(a, 0) = |a| and gcd(0, 0) = 0', () => {
    expect(bigGcd(0n, 0n)).toBe(0n)
    expect(bigGcd(0n, 123456n)).toBe(123456n)
    expect(bigGcd(-987654321n, 0n)).toBe(987654321n)
  })
  it('co-prime returns 1', () => {
    expect(bigGcd(17n, 31n)).toBe(1n)
    expect(bigGcd(99991n, 10007n)).toBe(1n)
  })
  it('multiples return the factor', () => {
    expect(bigGcd(54n, 24n)).toBe(6n)
    expect(bigGcd(24n, 54n)).toBe(6n) // symmetry
    expect(bigGcd(6n * 12345n, 6n * 6789n)).toBe(18n)
  })
})

describe('bigPow10', () => {
  it('boundary values: 0, 1, and 2000', () => {
    expect(bigPow10(0)).toBe(1n)
    expect(bigPow10(1)).toBe(10n)
    const p2000 = bigPow10(2000)
    // p2000 should be "1" followed by 2000 zeros → length 2001
    expect(p2000.toString().length).toBe(2001)
    expect(p2000 % TEN).toBe(0n) // divisible by 10
  })
  it('accepts bigint exponent and truncates number exponent', () => {
    expect(bigPow10(5n)).toBe(100000n)
    // Math.trunc behavior: 3.9 -> 3
    expect(bigPow10(3.9)).toBe(1000n)
    expect(bigPow10(-0.4)).toBe(1n) // trunc(-0.4)=0 → 10^0
  })
  it('monotonic increase with exponent', () => {
    expect(bigPow10(2)).toBe(100n)
    expect(bigPow10(3)).toBe(1000n)
    expect(bigPow10(4)).toBe(10000n)
  })
  it('throws for invalid ranges', () => {
    expect(() => bigPow10(-1)).toThrow(/≥ 0/)
    expect(() => bigPow10(2001)).toThrow(/≤ 2000/)
    expect(() => bigPow10(9999999999)).toThrow(/≤ 2000/)
  })
})

describe('bigSign', () => {
  it('returns 0 for zero', () => {
    expect(bigSign(0n)).toBe(0)
  })
  it('returns 1 for positive values', () => {
    expect(bigSign(1n)).toBe(1)
    expect(bigSign(999999999999999999n)).toBe(1)
  })
  it('returns -1 for negative values', () => {
    expect(bigSign(-1n)).toBe(-1)
    expect(bigSign(-999999999999999999n)).toBe(-1)
  })
})
