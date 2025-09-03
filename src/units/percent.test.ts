// percent.spec.ts
import { describe, expect, it } from 'vitest'
import { bigScale } from '../scaling/index'
import {
  calcBigPercentFrom,
  calcPercentFrom,
  calcPercentOf,
  decreaseByPercent,
  divideByFactor,
  increaseByPercent,
  multiplyByFactor,
} from './percent'

// =====================================================================
// calcPercentOf
// =====================================================================
describe('calcPercentOf', () => {
  it('calculates the correct percentage of a positive amount', () => {
    // 25% of 200 (scaled to 8 decimals) should be 50
    const amount = bigScale(200, 8)
    const result = calcPercentOf(amount, 25)
    expect(result).toBe(bigScale(50, 8))
  })

  it('calculates the correct percentage of a negative amount', () => {
    // 10% of -123.45 should be -12.345
    const amount = bigScale('-123.45', 8)
    const result = calcPercentOf(amount, 10)
    expect(result).toBe(bigScale('-12.345', 8))
  })

  it('handles zero inputs correctly', () => {
    const amount = bigScale(100, 8)
    expect(calcPercentOf(0n, 25)).toBe(0n)
    expect(calcPercentOf(amount, 0)).toBe(0n)
  })

  it('handles fractional percentages', () => {
    // 12.34% of 12345 should be 1523.373
    const amount = bigScale(12345, 8)
    const result = calcPercentOf(amount, 12.34)
    expect(result).toBe(bigScale('1523.373', 8))
  })
})

// =====================================================================
// calcPercentFrom
// =====================================================================
describe('calcPercentFromNumber (for display)', () => {
  it('should return a number for a standard percentage', () => {
    // 50 is 25% of 200
    const result = calcPercentFrom(50, 200)
    expect(result).toEqual(25)
  })

  it('should handle percentages over 100%', () => {
    // 300 is 150% of 200
    const result = calcPercentFrom(300, 200)
    expect(result).toEqual(150)

    expect(calcPercentFrom(11665962006784n, 18704454701357n)).toEqual(62.36)
    expect(calcPercentFrom(961138873493n, 1209310852777n)).toEqual(79.47)
  })

  it('should handle fractional percentages with specified precision', () => {
    // 1 is ~33.33% of 3
    const result = calcPercentFrom(1, 3, 4) // Ask for 4 decimal places
    expect(result).toEqual(33.3333)
  })

  it('should handle zero partAmount', () => {
    const result = calcPercentFrom(0, 100)
    expect(result).toEqual(0)
  })
})

// =====================================================================
// calcBigPercentFrom
// =====================================================================
describe('calcBigPercentFrom', () => {
  it('calculates the correct percentage', () => {
    // 50 is 25% of 200
    const part = bigScale(50, 8)
    const total = bigScale(200, 8)
    const result = calcBigPercentFrom(part, total)
    expect(result).toBe(bigScale(25, 4)) // Percentages are scaled to 4 decimals
  })

  it('handles part greater than total (>100%)', () => {
    // 250 is 125% of 200
    const part = bigScale(250, 6)
    const total = bigScale(200, 6)
    const result = calcBigPercentFrom(part, total)
    expect(result).toBe(bigScale(125, 4))
  })

  it('handles negative parts', () => {
    // -10 is -5% of 200
    const part = bigScale(-10, 8)
    const total = bigScale(200, 8)
    const result = calcBigPercentFrom(part, total)
    expect(result).toBe(bigScale(-5, 4))
  })

  it('handles zero inputs', () => {
    expect(calcBigPercentFrom(0n, bigScale(10, 6))).toBe(0n)
    expect(calcBigPercentFrom(bigScale(10, 6), 0n)).toBe(0n)
  })
})

// =====================================================================
// increaseByPercent / decreaseByPercent
// =====================================================================
describe('increaseByPercent', () => {
  it('increases a positive amount by a percentage', () => {
    // 1200 + 23% = 1476
    const amount = bigScale(1200, 8)
    const result = increaseByPercent(amount, 23)
    expect(result).toBe(bigScale(1476, 8))

    expect(increaseByPercent(BigInt(2e8), 5)).toBe(BigInt(21e7)) // 2 -> 2.1
  })

  it('increases a negative amount by a percentage', () => {
    // -1200 + 23% of -1200 = -1200 + (-276) = -1476
    const amount = bigScale(-1200, 8)
    const result = increaseByPercent(amount, 23)
    expect(result).toBe(bigScale(-1476, 8))
  })

  it('returns the same amount for a 0% increase', () => {
    const amount = bigScale('98765.4321', 8)
    expect(increaseByPercent(amount, 0)).toBe(amount)
  })
})

describe('decreaseByPercent', () => {
  it('decreases a positive amount by a percentage', () => {
    // 1000 - 25% = 750
    const amount = bigScale(1000, 8)
    const result = decreaseByPercent(amount, 25)
    expect(result).toBe(bigScale(750, 8))

    expect(decreaseByPercent(BigInt(2e8), 5)).toBe(BigInt(19e7)) // 2 -> 1.9
  })

  it('decreases a negative amount by a percentage', () => {
    // -200 - 10% of -200 = -200 - (-20) = -180
    const amount = bigScale(-200, 8)
    const result = decreaseByPercent(amount, 10)
    expect(result).toBe(bigScale(-180, 8))
  })

  it('returns 0 when decreasing by 100%', () => {
    const amount = bigScale(1000, 8)
    expect(decreaseByPercent(amount, 100)).toBe(0n)
  })

  it('returns a negative value when decreasing by more than 100%', () => {
    const amount = bigScale(1000, 8)
    expect(decreaseByPercent(amount, 110)).toBe(bigScale(-100, 8))
  })
})

// =====================================================================
// multiplyByFactor / divideByFactor
// =====================================================================
describe('multiplyByFactor', () => {
  it('multiplies an amount by a factor', () => {
    const amount = bigScale(250, 8)
    expect(multiplyByFactor(amount, 2.5)).toBe(bigScale(625, 8))
    expect(multiplyByFactor(amount, 1)).toBe(amount)
    expect(multiplyByFactor(amount, 0)).toBe(0n)
    expect(multiplyByFactor(2, 2)).toBe(4n)
    expect(multiplyByFactor(100, 3)).toBe(300n)
    expect(multiplyByFactor(BigInt(1e6), 2)).toBe(BigInt(2e6))
  })

  it('multiplies a negative amount by a factor', () => {
    const amount = bigScale(-250, 8)
    expect(multiplyByFactor(amount, 2)).toBe(bigScale(-500, 8))
  })
})

describe('divideByFactor', () => {
  it('divides an amount by a factor', () => {
    const amount = bigScale(250, 8)
    expect(divideByFactor(amount, 2.5)).toBe(bigScale(100, 8))
    expect(divideByFactor(amount, 2)).toBe(bigScale(125, 8))
  })

  it('divides a negative amount by a factor', () => {
    const amount = bigScale(-250, 8)
    expect(divideByFactor(amount, 4)).toBe(bigScale(-62.5, 8))
    expect(divideByFactor(300, 3)).toBe(100n)
  })

  it('throws an error for a non-positive divisor', () => {
    const amount = bigScale(100, 8)
    expect(() => divideByFactor(amount, 0)).toThrow(/positive/i)
    expect(() => divideByFactor(amount, -2)).toThrow(/positive/i)
  })
})
