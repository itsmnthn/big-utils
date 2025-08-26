import { describe, expect, it } from 'vitest'
import { bigCeilDiv, bigDivRound, bigFloorDiv, bigRoundIntByStep, ROUND_MODES } from './rounding'

// ----------------------------- bigFloorDiv -----------------------------------
describe('bigFloorDiv — floor toward -∞', () => {
  it('basic positives', () => {
    expect(bigFloorDiv(7n, 3n)).toBe(2n)
    expect(bigFloorDiv(6n, 3n)).toBe(2n)
    expect(bigFloorDiv(1n, 3n)).toBe(0n)
  })

  it('negatives (numerator negative)', () => {
    expect(bigFloorDiv(-7n, 3n)).toBe(-3n) // -2.333.. → -3
    expect(bigFloorDiv(-6n, 3n)).toBe(-2n)
    expect(bigFloorDiv(-1n, 3n)).toBe(-1n)
  })

  it('negatives (denominator negative)', () => {
    expect(bigFloorDiv(7n, -3n)).toBe(-3n) // 7/(-3) = -2.333.. → -3
    expect(bigFloorDiv(-7n, -3n)).toBe(2n) // 2.333.. → 2
  })

  it('zero numerator', () => {
    expect(bigFloorDiv(0n, 5n)).toBe(0n)
    expect(bigFloorDiv(0n, -5n)).toBe(0n)
  })

  it('±1 denominator', () => {
    expect(bigFloorDiv(7n, 1n)).toBe(7n)
    expect(bigFloorDiv(7n, -1n)).toBe(-7n)
    expect(bigFloorDiv(-7n, -1n)).toBe(7n)
  })

  it('throws on division by zero', () => {
    expect(() => bigFloorDiv(1n, 0n)).toThrow(/division by zero/i)
  })
})

// ----------------------------- bigCeilDiv ------------------------------------
describe('bigCeilDiv — ceil toward +∞', () => {
  it('basic positives', () => {
    expect(bigCeilDiv(7n, 3n)).toBe(3n)
    expect(bigCeilDiv(6n, 3n)).toBe(2n)
    expect(bigCeilDiv(1n, 3n)).toBe(1n)
  })

  it('negatives (numerator negative)', () => {
    expect(bigCeilDiv(-7n, 3n)).toBe(-2n) // -2.333.. → -2
    expect(bigCeilDiv(-6n, 3n)).toBe(-2n)
    expect(bigCeilDiv(-1n, 3n)).toBe(0n)
  })

  it('negatives (denominator negative)', () => {
    expect(bigCeilDiv(7n, -3n)).toBe(-2n) // -2.333.. → -2
    expect(bigCeilDiv(-7n, -3n)).toBe(3n)
  })

  it('zero numerator', () => {
    expect(bigCeilDiv(0n, 5n)).toBe(0n)
    expect(bigCeilDiv(0n, -5n)).toBe(0n)
  })

  it('±1 denominator', () => {
    expect(bigCeilDiv(7n, 1n)).toBe(7n)
    expect(bigCeilDiv(7n, -1n)).toBe(-7n)
  })

  it('throws on division by zero', () => {
    expect(() => bigCeilDiv(1n, 0n)).toThrow(/division by zero/i)
  })
})

// ----------------------------- bigDivRound -----------------------------------
describe('bigDivRound — directional modes parity', () => {
  it('dOWN matches floor; UP matches ceil; TRUNC matches /', () => {
    const cases: Array<[bigint, bigint]> = [
      [7n, 3n],
      [-7n, 3n],
      [7n, -3n],
      [-7n, -3n],
      [0n, 5n],
      [5n, 2n],
    ]
    for (const [a, d] of cases) {
      expect(bigDivRound(a, d, ROUND_MODES.DOWN)).toBe(bigFloorDiv(a, d))
      expect(bigDivRound(a, d, ROUND_MODES.UP)).toBe(bigCeilDiv(a, d))
      expect(bigDivRound(a, d, ROUND_MODES.TRUNC)).toBe(a / d)
    }
  })
})

describe('bigDivRound — exact division returns quotient', () => {
  it('remainder zero across signs', () => {
    expect(bigDivRound(12n, 3n, ROUND_MODES.HALF_EVEN)).toBe(4n)
    expect(bigDivRound(-12n, 3n, ROUND_MODES.HALF_FLOOR)).toBe(-4n)
    expect(bigDivRound(12n, -3n, ROUND_MODES.HALF_CEILING)).toBe(-4n)
    expect(bigDivRound(-12n, -3n, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(4n)
  })
})

describe('bigDivRound — halfway/tie behavior (.5 of a unit)', () => {
  // Helper to assert all modes at a tie where |remainder| * 2 == |denominator|
  function assertTie(n: bigint, d: bigint, qEven: boolean) {
    const modes = ROUND_MODES
    const sgn = (n >= 0n) === (d >= 0n) ? 1 : -1

    // Expected map
    const exp: Record<string, bigint> = {
      [modes.HALF_AWAY_ZERO]: (n / d) + BigInt(sgn),
      [modes.HALF_TOWARDS_ZERO]: n / d,
      [modes.HALF_FLOOR]: sgn < 0 ? (n / d) + BigInt(sgn) : (n / d),
      [modes.HALF_CEILING]: sgn > 0 ? (n / d) + BigInt(sgn) : (n / d),
      [modes.HALF_EVEN]: qEven ? (n / d) : (n / d) + BigInt(sgn),
    }

    // Sanity: it's a tie
    const ar = (n % d) >= 0n ? (n % d) : -(n % d)
    const ad = d >= 0n ? d >= 0n ? d : -d : -d
    expect(ar * 2n === (ad >= 0n ? ad : -ad)).toBe(true)

    for (const [mode, expected] of Object.entries(exp)) {
      expect(bigDivRound(n, d, mode as any)).toBe(expected)
    }
  }

  it('positive tie: 5/2 = 2.5', () => {
    // quotient=2 (even)
    assertTie(5n, 2n, true)
  })

  it('positive tie, odd quotient: 3/2 = 1.5', () => {
    // quotient=1 (odd)
    assertTie(3n, 2n, false)
  })

  it('negative tie: -5/2 = -2.5', () => {
    // quotient=-2 (even), sgn negative
    assertTie(-5n, 2n, true)
  })

  it('negative divisor tie: 5/(-2) = -2.5', () => {
    // quotient=-2 (even), sgn negative
    assertTie(5n, -2n, true)
  })
})

describe('bigDivRound — nearest (non-tie) rounding', () => {
  it('rounds to nearest away/towards based on remainder fraction', () => {
    // 7/3 = 2 + 1/3 ( < .5 ) → nearest is 2 for all "nearest" styles
    expect(bigDivRound(7n, 3n, ROUND_MODES.HALF_EVEN)).toBe(2n)
    expect(bigDivRound(7n, 3n, ROUND_MODES.HALF_AWAY_ZERO)).toBe(2n)
    // 8/3 = 2 + 2/3 ( > .5 ) → nearest is 3 (sgn positive)
    expect(bigDivRound(8n, 3n, ROUND_MODES.HALF_EVEN)).toBe(3n)

    // Negative numerator
    // -7/3 = -2 - 1/3 → nearest is -2
    expect(bigDivRound(-7n, 3n, ROUND_MODES.HALF_EVEN)).toBe(-2n)
    // -8/3 = -2 - 2/3 → nearest is -3
    expect(bigDivRound(-8n, 3n, ROUND_MODES.HALF_EVEN)).toBe(-3n)
  })
})

describe('bigDivRound — invariants & large values', () => {
  it('sign invariance: dividing both by -1 yields same result', () => {
    const modes = Object.values(ROUND_MODES)
    const pairs: Array<[bigint, bigint]> = [
      [123n, 10n],
      [-123n, 10n],
      [123n, -10n],
      [-123n, -10n],
    ]
    for (const [a, d] of pairs) {
      for (const m of modes) {
        expect(bigDivRound(-a, -d, m)).toBe(bigDivRound(a, d, m))
      }
    }
  })

  it('very large numbers (no overflow) and tie correctness', () => {
    // Construct a *tie* with huge denominator:
    const D = 2n * (10n ** 60n) // even
    const q = 10n ** 40n + 123n // arbitrary large quotient
    const N = q * D + (D / 2n) // exact half step

    // HALF_EVEN: result parity depends on q parity
    const resEven = bigDivRound(N, D, ROUND_MODES.HALF_EVEN)
    expect(resEven).toBe(q % 2n === 0n ? q : q + 1n)

    // HALF_AWAY_ZERO: always q+1 for positive sgn
    const resAway = bigDivRound(N, D, ROUND_MODES.HALF_AWAY_ZERO)
    expect(resAway).toBe(q + 1n)

    // TRUNC vs DOWN/UP around this huge tie
    expect(bigDivRound(N, D, ROUND_MODES.TRUNC)).toBe(q)
    expect(bigDivRound(N, D, ROUND_MODES.DOWN)).toBe(q) // floor for positive tie is q
    expect(bigDivRound(N, D, ROUND_MODES.UP)).toBe(q + 1n) // ceil for positive tie is q+1
  })

  it('throws on division by zero', () => {
    expect(() => bigDivRound(1n, 0n, ROUND_MODES.TRUNC)).toThrow(/division by zero/i)
  })
})

// --------------------------- bigRoundIntByStep --------------------------------
describe('bigRoundIntByStep — rounding to step grid', () => {
  it('throws when step <= 0', () => {
    expect(() => bigRoundIntByStep(10n, 0n, ROUND_MODES.TRUNC)).toThrow(/step must be > 0/i)
    expect(() => bigRoundIntByStep(10n, -8n, ROUND_MODES.TRUNC)).toThrow(/step must be > 0/i)
  })

  it('tRUNC on positives & negatives', () => {
    expect(bigRoundIntByStep(17n, 8n, ROUND_MODES.TRUNC)).toBe(16n) // 2 * 8
    expect(bigRoundIntByStep(-17n, 8n, ROUND_MODES.TRUNC)).toBe(-16n) // -2 * 8
  })

  it('dOWN (floor) vs UP (ceil) on negatives', () => {
    // -17/8 = -2.125 → floor -3, ceil -2
    expect(bigRoundIntByStep(-17n, 8n, ROUND_MODES.DOWN)).toBe(-24n)
    expect(bigRoundIntByStep(-17n, 8n, ROUND_MODES.UP)).toBe(-16n)
  })

  it('halfway ties for positive values (n=20, step=8)', () => {
    // 20/8 = 2.5 → tie
    expect(bigRoundIntByStep(20n, 8n, ROUND_MODES.HALF_AWAY_ZERO)).toBe(24n)
    expect(bigRoundIntByStep(20n, 8n, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(16n)
    expect(bigRoundIntByStep(20n, 8n, ROUND_MODES.HALF_EVEN)).toBe(16n) // q=2 even → stays
    expect(bigRoundIntByStep(20n, 8n, ROUND_MODES.HALF_FLOOR)).toBe(16n) // toward -∞
    expect(bigRoundIntByStep(20n, 8n, ROUND_MODES.HALF_CEILING)).toBe(24n) // toward +∞
  })

  it('halfway ties for negative values (n=-20, step=8)', () => {
    // -20/8 = -2.5 → tie
    expect(bigRoundIntByStep(-20n, 8n, ROUND_MODES.HALF_AWAY_ZERO)).toBe(-24n)
    expect(bigRoundIntByStep(-20n, 8n, ROUND_MODES.HALF_TOWARDS_ZERO)).toBe(-16n)
    expect(bigRoundIntByStep(-20n, 8n, ROUND_MODES.HALF_EVEN)).toBe(-16n) // |q| even → stays
    expect(bigRoundIntByStep(-20n, 8n, ROUND_MODES.HALF_FLOOR)).toBe(-24n) // toward -∞
    expect(bigRoundIntByStep(-20n, 8n, ROUND_MODES.HALF_CEILING)).toBe(-16n) // toward +∞
  })

  it('step=1 is identity under any mode', () => {
    const vals = [-5n, -1n, 0n, 1n, 5n, 123456789n]
    const modes = Object.values(ROUND_MODES)
    for (const v of vals) {
      for (const m of modes)
        expect(bigRoundIntByStep(v, 1n, m)).toBe(v)
    }
  })

  it('works for large n and prime step', () => {
    const n = 10n ** 30n + 12345n
    const step = 97n
    // compute via core rounding (no separate oracle): just check no throw and result multiple of step
    const out = bigRoundIntByStep(n, step, ROUND_MODES.HALF_EVEN)
    expect(out % step).toBe(0n)
  })
})
