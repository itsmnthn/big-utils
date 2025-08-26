import { describe, expect, it } from 'vitest'
import { bigLog2Scaled, bigLogBaseScaled, bigPrecomputeBase } from '.'
import { bigAbs, bigPow10 } from '../core'
import { bigScale } from '../scaling/scale'

/** Compare two scaled bigints within an absolute tolerance (in scaled units). */
function expectClose(actual: bigint, expected: bigint, tol = 5n) {
  const diff = bigAbs(actual - expected)
  if (diff > tol) {
    // This will provide a clear error message in case of failure
    expect(actual, `|actual-expected|=${diff} > tol=${tol}`).toBe(expected)
  }
  else {
    // Pass the test if within tolerance
    expect(true).toBe(true)
  }
}

/** Build a BigInt expected value from a JS Number reference safely for small scales. */
function expectFromNumber(ref: number, scale: number): bigint {
  if (scale > 9) {
    throw new Error(`expectFromNumber: scale ${scale} > 9, may cause precision loss`)
  }
  const m = 10 ** scale // safe for scale <= 9
  return BigInt(Math.round(ref * m))
}

// -------------------- bigLog2Scaled --------------------
describe('bigLog2Scaled — success cases', () => {
  it('log2(1) = 0 at any scale', () => {
    const s = 8
    const one = bigScale('1', s)
    const out = bigLog2Scaled(one, s)
    expect(out).toBe(0n)
  })

  it('log2(2) ≈ 1', () => {
    const s = 8
    const x = bigScale('2', s)
    const out = bigLog2Scaled(x, s)
    const expected = bigPow10(s) // 1 * 10^s
    expectClose(out, expected, 2n)
  })

  it('log2(0.5) ≈ -1', () => {
    const s = 8
    const x = bigScale('0.5', s)
    const out = bigLog2Scaled(x, s)
    const expected = -bigPow10(s)
    expectClose(out, expected, 2n)
  })

  it('log2(10) ≈ 3.321928094...', () => {
    const s = 8
    const x = bigScale('10', s)
    const out = bigLog2Scaled(x, s)
    const expected = expectFromNumber(Math.log2(10), s)
    expectClose(out, expected, 10n)
  })

  it('monotonicity: larger x -> larger log2(x)', () => {
    const s = 6
    const a = bigScale('1.2', s)
    const b = bigScale('1.8', s)
    const la = bigLog2Scaled(a, s)
    const lb = bigLog2Scaled(b, s)
    expect(lb > la).toBe(true)
  })

  it('more iterations reduce error (typical case)', () => {
    const s = 8
    const x = bigScale('3.14159265', s)
    const out16 = bigLog2Scaled(x, s, 16)
    const out96 = bigLog2Scaled(x, s, 96)
    const ref = expectFromNumber(Math.log2(3.14159265), s)
    const err16 = bigAbs(out16 - ref)
    const err96 = bigAbs(out96 - ref)
    expect(err96 <= err16).toBe(true)
  })
})

describe('bigLog2Scaled — failures', () => {
  it('throws for xScaled <= 0', () => {
    const s = 6
    expect(() => bigLog2Scaled(0n, s)).toThrow(/must be > 0/i)
    expect(() => bigLog2Scaled(-123n, s)).toThrow(/must be > 0/i)
  })
  it('numerical accuracy vs Math.log/Math.log for common inputs', () => {
    const s = 8
    const pairs: Array<[string, string]> = [
      ['3', '2'],
      ['10', '2'],
      ['2', '10'],
      ['1.2345', '1.01'],
    ]
    for (const [xs, bs] of pairs) {
      const x = bigScale(xs, s)
      const b = bigScale(bs, s)
      const out = bigLogBaseScaled(x, b, s)
      const ref = expectFromNumber(Math.log(Number(xs)) / Math.log(Number(bs)), s)
      // For bases close to 1, the logarithm calculation is less stable
      // Use adaptive tolerance based on how close the base is to 1
      const baseDiff = Math.abs(Number(bs) - 1)
      const tolerance = baseDiff < 0.1 ? 10000n : 100n
      expectClose(out, ref, tolerance)
    }
  })
})

describe('bigLogBaseScaled — failures', () => {
  it('throws if xScaled <= 0 or baseScaled <= 0', () => {
    const s = 6
    const base = bigScale('2', s)
    const x = bigScale('2', s)
    expect(() => bigLogBaseScaled(0n, base, s)).toThrow(/must be > 0/i)
    expect(() => bigLogBaseScaled(x, 0n, s)).toThrow(/must be > 0/i)
    expect(() => bigLogBaseScaled(-1n, base, s)).toThrow(/must be > 0/i)
    expect(() => bigLogBaseScaled(x, -1n, s)).toThrow(/must be > 0/i)
  })
})

// -------------------- bigPrecomputeBase --------------------
describe('bigPrecomputeBase — behavior', () => {
  it('returns baseScaled identical to bigScale(base, scale)', () => {
    const s = 8
    const res = bigPrecomputeBase('1.0001', s)
    expect(res.baseScaled).toBe(bigScale('1.0001', s))
    expect(res.scale).toBe(s)
  })

  it('log2BaseScaled matches bigLog2Scaled(baseScaled, scale)', () => {
    const s = 8
    const base = '1.234567'
    const { baseScaled, log2BaseScaled } = bigPrecomputeBase(base, s)
    const check = bigLog2Scaled(baseScaled, s)
    expectClose(log2BaseScaled, check, 2n)
  })
})

// -------------------- edge cases --------------------
describe('edge cases', () => {
  it('very small x (but > 0) works', () => {
    const s = 8
    const tiny = bigScale('0.000001', s)
    const out = bigLog2Scaled(tiny, s)
    // ~ log2(1e-6) ≈ -19.931568... → about -19.931568 * 1e8
    const ref = expectFromNumber(Math.log2(1e-6), s)
    expectClose(out, ref, 50n)
  })

  it('very large x works', () => {
    const s = 8
    const big = bigScale('1234567.89', s)
    const out = bigLog2Scaled(big, s)
    const ref = expectFromNumber(Math.log2(1234567.89), s)
    expectClose(out, ref, 50n)
  })

  it('iteration parameter affects accuracy but does not throw', () => {
    const s = 6
    const x = bigScale('7.77', s)
    const a = bigLog2Scaled(x, s, 8)
    const b = bigLog2Scaled(x, s, 24)
    const c = bigLog2Scaled(x, s, 96)
    expect([a, b, c].every(v => typeof v === 'bigint')).toBe(true)
  })
})
