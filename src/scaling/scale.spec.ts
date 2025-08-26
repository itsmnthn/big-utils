import { describe, expect, it } from 'vitest'
import { ROUND_MODES } from '../arithmetic/rounding'
import { bigPow10 } from '../core'
import { bigScale, bigUnscale } from './scale'

const pow10 = (d: number) => bigPow10(d)

// ------------------------- bigScale -------------------------
describe('bigScale — success cases', () => {
  it('parses integers, decimals, and exponent notation', () => {
    expect(bigScale('123', 0)).toBe(123n)
    expect(bigScale('123', 2)).toBe(12300n)
    expect(bigScale('1.23', 2)).toBe(123n)
    expect(bigScale('1.23', 6)).toBe(1230000n)
    expect(bigScale('1.23e3', 2)).toBe(123000n) // 1230 * 1e2
    expect(bigScale('1.23E-3', 6)).toBe(1230n) // 0.00123 * 1e6
  })

  it('handles leading/trailing zeros and whitespace', () => {
    expect(bigScale(' 00123.4500 ', 2)).toBe(12345n)
    expect(bigScale(' .75 ', 4)).toBe(7500n) // ".75" → 0.75
    expect(bigScale('-.75', 2)).toBe(-75n)
  })

  it('bigint input multiplies by 10^scale exactly', () => {
    expect(bigScale(5n, 6)).toBe(5n * pow10(6))
    expect(bigScale(-42n, 0)).toBe(-42n)
  })

  it('zero stays zero regardless of sign/format', () => {
    expect(bigScale('0', 8)).toBe(0n)
    expect(bigScale('-0', 8)).toBe(0n)
    expect(bigScale('0.000', 5)).toBe(0n)
    expect(bigScale('0e10', 1)).toBe(0n)
  })

  it('nearest rounding away from zero by default (HALF_AWAY_ZERO)', () => {
    // 1.234 @ 2 → 1.23 ; 1.235 @ 2 → 1.24
    expect(bigScale('1.234', 2)).toBe(123n)
    expect(bigScale('1.235', 2)).toBe(124n)
    // negative ties go away from zero as well
    expect(bigScale('-1.235', 2)).toBe(-124n)
  })

  it('hALF_EVEN tie-handling', () => {
    // 1.005 @ 2 → tie (100.5). Even neighbor is 100.
    expect(bigScale('1.005', 2, ROUND_MODES.HALF_EVEN)).toBe(100n) // Wait: scaled total = 100.5 → *nearest even integer total* at 2dp -> 101? Verify carefully
  })
})

describe('bigScale — rounding nuance per mode at ties', () => {
  // Build a canonical tie: value=1.005 at scale=2 → 100.5 exactly
  const s = '1.005'
  const scale = 2

  it('hALF_AWAY_ZERO', () => {
    expect(bigScale(s, scale, ROUND_MODES.HALF_AWAY_ZERO)).toBe(101n)
    expect(bigScale(`-${s}`, scale, ROUND_MODES.HALF_AWAY_ZERO)).toBe(-101n)
  })
  it('hALF_TOWARDS_ZERO', () => {
    expect(bigScale(s, scale, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(100n)
    expect(bigScale(`-${s}`, scale, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(-100n)
  })
  it('hALF_EVEN', () => {
    // 100 is even → stay; -100 is even magnitude → stay
    expect(bigScale(s, scale, ROUND_MODES.HALF_EVEN)).toBe(100n)
    expect(bigScale(`-${s}`, scale, ROUND_MODES.HALF_EVEN)).toBe(-100n)
  })
  it('hALF_FLOOR vs HALF_CEILING', () => {
    // positive tie → FLOOR stays, CEILING bumps
    expect(bigScale(s, scale, ROUND_MODES.HALF_FLOOR)).toBe(100n)
    expect(bigScale(s, scale, ROUND_MODES.HALF_CEILING)).toBe(101n)
    // negative tie → FLOOR bumps (toward -∞), CEILING stays
    expect(bigScale(`-${s}`, scale, ROUND_MODES.HALF_FLOOR)).toBe(-101n)
    expect(bigScale(`-${s}`, scale, ROUND_MODES.HALF_CEILING)).toBe(-100n)
  })
})

describe('bigScale — failures / guards', () => {
  it('invalid literals throw', () => {
    const bad = ['', '  ', '.', '+', 'e10', '1e', '1.2.3', '1a2', '--1', '+-1']
    for (const v of bad) {
      expect(() => bigScale(v as any, 2)).toThrow(/invalid input/i)
    }
  })

  it('pow10 guard: large positive k or large negative k throws (>|2000|)', () => {
    // For "1" with scale=2001 → k=2001 (positive path)
    expect(() => bigScale('1', 2001)).toThrow(/≤ 2000/)
    // For "1e-1" with scale=-2001 → k = -2002 (negative path uses 10^(-k) = 10^2002)
    expect(() => bigScale('1', -2001)).toThrow(/≤ 2000/)
  })

  it('bigint input with negative scale throws via pow10 guard', () => {
    expect(() => bigScale(5n, -1)).toThrow(/≥ 0/)
  })
})

// ------------------------- bigUnscale -------------------------
describe('bigUnscale — success & formatting', () => {
  it('basic integer output when outDecimals=0', () => {
    expect(bigUnscale(1234567n, 6, 0)).toBe('1') // 1.234567 → "1"
    expect(bigUnscale(100n, 2, 0)).toBe('1')
    expect(bigUnscale(-100n, 2, 0)).toBe('-1')
  })

  it('pads fraction to requested decimals', () => {
    expect(bigUnscale(100n, 2, 3)).toBe('1.000')
    expect(bigUnscale(12345n, 4, 6)).toBe('1.234500')
    expect(bigUnscale(1n, 0, 2)).toBe('1.00')
  })

  it('tRUNC by default when reducing displayed decimals', () => {
    // x=1.234567 @ scale=6 → show 2 dp = 1.23
    expect(bigUnscale(1_234_567n, 6, 2)).toBe('1.23')
    expect(bigUnscale(-1_234_567n, 6, 2)).toBe('-1.23')
  })

  it('half-mode rounding at ties when reducing decimals', () => {
    // x = 1.25 @ scale=2; show 1 dp → 1.2 or 1.3 depending on mode
    const x = 125n
    const scale = 2
    // TRUNC remains 1.2
    expect(bigUnscale(x, scale, 1, ROUND_MODES.TRUNC)).toBe('1.2')
    // HALF_AWAY_ZERO → 1.3
    expect(bigUnscale(x, scale, 1, ROUND_MODES.HALF_AWAY_ZERO)).toBe('1.3')
    // HALF_EVEN: neighbor 12 (even) → stay
    expect(bigUnscale(x, scale, 1, ROUND_MODES.HALF_EVEN)).toBe('1.2')
    // Negative variant
    expect(bigUnscale(-x, scale, 1, ROUND_MODES.HALF_AWAY_ZERO)).toBe('-1.3')
    expect(bigUnscale(-x, scale, 1, ROUND_MODES.HALF_EVEN)).toBe('-1.2')
  })

  it('more outDecimals than scale increases precision display with zeros & rounding', () => {
    // 1.2 @ scale=1 → out=3 with TRUNC → "1.200"
    expect(bigUnscale(12n, 1, 3)).toBe('1.200')
    // rounding example: 1.2345 @ scale=4 → out=3 with HALF_AWAY_ZERO → "1.235"
    expect(bigUnscale(12_345n, 4, 3, ROUND_MODES.HALF_AWAY_ZERO)).toBe('1.235')
  })
})
