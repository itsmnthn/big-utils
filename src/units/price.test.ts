// amount.spec.ts
import { describe, expect, it } from 'vitest'
import { calcTotalPrice, calcUnitPrice, calcUnits } from './price'

const pow10 = (d: number) => 10n ** BigInt(d)

const PRICE_DECIMALS = [4, 6, 8, 10] as const
const UNIT_DECIMALS = [6, 8, 10, 12, 18] as const

// Base "human" counts (integer unit counts, not yet scaled)
const UNIT_COUNTS = [1n, 2n, 17n, 1_234n, 98_765n, 1_000_000n]

// Price integers (already at price-decimal scale in the math)
// e.g., at 6dp, 4_535_356n means 4.535356
const PRICE_INTS = [1n, 99n, 12_345n, 987_654n, 4_535_356n, 123_456_789n]

// ------------------------------- calcTotalPrice -------------------------------
describe('calcTotalPrice — correctness across scales & magnitudes', () => {
  for (const ud of UNIT_DECIMALS) {
    for (const pd of PRICE_DECIMALS) {
      it(`unitDecimals=${ud}, priceDecimals=${pd}`, () => {
        for (const a of UNIT_COUNTS) {
          const U = a * pow10(ud)

          for (const P of PRICE_INTS) {
            // Expected total price at price scale: (U * P) / 10^ud = a * P (exact)
            const expected = a * P

            // Positive units
            expect(calcTotalPrice(U, P, ud, pd)).toBe(expected)

            // Negative units (allowed) → sign propagates to total
            expect(calcTotalPrice(-U, P, ud, pd)).toBe(-expected)

            // Zero short-circuits
            expect(calcTotalPrice(0n, P, ud, pd)).toBe(0n)
            expect(calcTotalPrice(U, 0n, ud, pd)).toBe(0n)
          }
        }
      })
    }
  }

  it('unitDecimals = 0 → returns 0n by design', () => {
    // As per current implementation: if unitDecimals === 0, function returns 0n
    expect(calcTotalPrice(1_000n, 123n, 0, 6)).toBe(0n)
    expect(calcTotalPrice(0n, 123n, 0, 6)).toBe(0n)
  })
})

// ------------------------------- calcUnitPrice -------------------------------
describe('calcUnitPrice — correctness across scales & magnitudes', () => {
  for (const ud of UNIT_DECIMALS) {
    for (const pd of PRICE_DECIMALS) {
      it(`unitDecimals=${ud}, priceDecimals=${pd} (price is magnitude)`, () => {
        for (const a of UNIT_COUNTS) {
          const U = a * pow10(ud)

          for (const P of PRICE_INTS) {
            // Build a consistent total price: TP = total(U, P)
            const TP = a * P // exact (see total test)
            // Expect calcUnitPrice(TP, U) to return P (magnitude, always ≥ 0)
            expect(calcUnitPrice(TP, U, ud, pd)).toBe(P)

            // Negative inputs are absolutized internally → still P
            expect(calcUnitPrice(-TP, U, ud, pd)).toBe(P)
            expect(calcUnitPrice(TP, -U, ud, pd)).toBe(P)

            // Zero short-circuits
            expect(calcUnitPrice(0n, U, ud, pd)).toBe(0n)
            expect(calcUnitPrice(TP, 0n, ud, pd)).toBe(0n)
          }
        }
      })
    }
  }

  it('unitDecimals = 0 → returns 0n by design', () => {
    expect(calcUnitPrice(123n, 456n, 0, 6)).toBe(0n)
  })
})

// -------------------------------- calcUnits ----------------------------------
describe('calcUnits — correctness across scales & magnitudes', () => {
  for (const ud of UNIT_DECIMALS) {
    for (const pd of PRICE_DECIMALS) {
      it(`unitDecimals=${ud}, priceDecimals=${pd}`, () => {
        for (const a of UNIT_COUNTS) {
          const U = a * pow10(ud)

          for (const P of PRICE_INTS) {
            // Build a consistent total price: TP = a * P
            const TP = a * P

            // Positive path → units recovered exactly
            expect(calcUnits(TP, P, ud, pd)).toBe(U)

            // Negative total price → negative units (unitPrice treated as magnitude)
            expect(calcUnits(-TP, P, ud, pd)).toBe(-U)

            // Zero short-circuits
            expect(calcUnits(0n, P, ud, pd)).toBe(0n)
            expect(calcUnits(TP, 0n, ud, pd)).toBe(0n)
          }
        }
      })
    }
  }

  it('unitDecimals = 0 → returns 0n by design', () => {
    expect(calcUnits(123n, 456n, 0, 6)).toBe(0n)
  })
})

// ----------------------------- Cross invariants ------------------------------
describe('cross-function invariants (round trips)', () => {
  for (const ud of UNIT_DECIMALS) {
    for (const pd of PRICE_DECIMALS) {
      it(`round-trips @ unitDecimals=${ud}, priceDecimals=${pd}`, () => {
        for (const a of UNIT_COUNTS) {
          const U = a * pow10(ud)

          for (const P of PRICE_INTS) {
            const TP = calcTotalPrice(U, P, ud, pd) // should be a*P

            // unit price from (total, units) → P (magnitude)
            expect(calcUnitPrice(TP, U, ud, pd)).toBe(P)

            // units from (total, unit price) → U
            expect(calcUnits(TP, P, ud, pd)).toBe(U)

            // negative total → negative units
            expect(calcUnits(-TP, P, ud, pd)).toBe(-U)

            // negative units with positive price → negative total
            expect(calcTotalPrice(-U, P, ud, pd)).toBe(-TP)
          }
        }
      })
    }
  }
})
