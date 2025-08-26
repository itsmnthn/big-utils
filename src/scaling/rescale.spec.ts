import { describe, expect, it } from 'vitest'
import { ROUND_MODES } from '../arithmetic/rounding'
import { bigPow10 } from '../core'
import { bigAlignScales, bigRescale } from './rescale'

const pow10 = (d: number) => bigPow10(d)

// ------------------------- bigRescale -------------------------
describe('bigRescale — success cases', () => {
  it('no-op when fromScale == toScale', () => {
    expect(bigRescale(123n, 6, 6)).toBe(123n)
  })

  it('upscales by multiplying pow10', () => {
    expect(bigRescale(123n, 2, 5)).toBe(123n * pow10(3))
  })

  it('downscales by dividing with rounding (TRUNC default)', () => {
    // 1234567 @ 6 → to 2 = 12345.67 → 123 (TRUNC)
    expect(bigRescale(1_234_567n, 6, 2)).toBe(123n)
  })

  it('downscale tie-handling across modes', () => {
    // Make an exact tie: value at fromScale=2 → toScale=1
    // x=1.25→ 125 @ scale=2; div by 10 → 12.5
    const x = 125n
    expect(bigRescale(x, 2, 1, ROUND_MODES.HALF_AWAY_ZERO)).toBe(13n)
    expect(bigRescale(x, 2, 1, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(12n)
    expect(bigRescale(x, 2, 1, ROUND_MODES.HALF_EVEN)).toBe(12n) // 12 even
    // Negative
    expect(bigRescale(-x, 2, 1, ROUND_MODES.HALF_AWAY_ZERO)).toBe(-13n)
    expect(bigRescale(-x, 2, 1, ROUND_MODES.HALF_EVEN)).toBe(-12n)
  })

  it('round-trip exactness when up then down (no remainder path)', () => {
    const x = 987654321n
    const up = bigRescale(x, 4, 9) // * 1e5
    const back = bigRescale(up, 9, 4) // / 1e5 (exact)
    expect(back).toBe(x)
  })
})

describe('bigRescale — failure guards', () => {
  it('throws if pow10 exceeds guard (>|2000|)', () => {
    // Upscale path: to-from = 2001
    expect(() => bigRescale(1n, 0, 2001)).toThrow(/≤ 2000/)
    // Downscale path: from-to = 2001
    expect(() => bigRescale(1n, 2001, 0)).toThrow(/≤ 2000/)
  })
})

// ------------------------- bigAlignScales -------------------------
describe('bigAlignScales — success cases', () => {
  it('defaults to max(aScale, bScale)', () => {
    const res = bigAlignScales(100n, 2, 3n, 0) // a=1.00, b=3
    expect(res.scale).toBe(2)
    expect(res.a).toBe(100n)
    expect(res.b).toBe(300n) // 3 → 300 @ 2dp
  })

  it('uses provided targetScale', () => {
    // Scale both to 1dp
    const res = bigAlignScales(1234n, 3, 567n, 2, ROUND_MODES.TRUNC, 1)
    // 1.234 → 1.2, 5.67 → 5.6
    expect(res.scale).toBe(1)
    expect(res.a).toBe(12n) // 1.2 @ 1dp
    expect(res.b).toBe(56n) // 5.6 @ 1dp
  })

  it('respects rounding mode when reducing precision of either side', () => {
    // a: 1.25 @ 2dp → to 1dp; b already at 1dp
    const a = 125n
    const aScale = 2
    const b = 12n
    const bScale = 1
    const r1 = bigAlignScales(a, aScale, b, bScale, ROUND_MODES.HALF_AWAY_ZERO) // 1.3 vs 1.2
    expect(r1.a).toBe(125n)
    expect(r1.b).toBe(120n)
    expect(r1.scale).toBe(2)
    const r2 = bigAlignScales(a, aScale, b, bScale, ROUND_MODES.HALF_EVEN) // 1.3 vs 1.2
    expect(r2.a).toBe(125n)
    expect(r2.b).toBe(120n)
    expect(r2.scale).toBe(2)
  })
})

describe('bigAlignScales — invariants', () => {
  it('round-trip with same target does not change values', () => {
    const a = 123n
    const b = 456n
    const aligned = bigAlignScales(a, 4, b, 4)
    expect(aligned.a).toBe(a)
    expect(aligned.b).toBe(b)
    expect(aligned.scale).toBe(4)
  })
})
