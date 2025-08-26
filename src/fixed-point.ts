import type { BigRounding } from './rounding'
import { bigAbs, bigGcd, bigPow10 } from './core'
import { bigDivRound, ROUND_MODES } from './rounding'

/** BigInt constants (verbosely named to aid readability). */
const BIG_ZERO = BigInt(0)
const BIG_ONE = BigInt(1)
const BIG_TWO = BigInt(2)

/**
 * Compute (a * b) / d with truncation.
 * Uses GCD reduction to minimize overflow risk.
 *
 * @throws RangeError if `d == 0`.
 * @example
 * bigMulDivTrunc(1000n, 3n, 2n) // -> 1500n
 */
export function bigMulDivTrunc(a: bigint, b: bigint, d: bigint): bigint {
  if (d === BIG_ZERO) {
    throw new RangeError('bigMulDivTrunc: division by zero')
  }

  let A = a
  let B = b
  let D = d
  let g = bigGcd(A, D)
  A /= g
  D /= g
  g = bigGcd(B, D)
  B /= g
  D /= g

  return (A * B) / D
}

/**
 * Compute (a * b) / d with rounding.
 * Uses GCD reduction to minimize overflow risk.
 * @param {bigint} a - First factor.
 * @param {bigint} b - Second factor.
 * @param {bigint} d - Denominator (must not be zero).
 * @param {BigRounding} mode - Rounding mode for the final division.
 * @throws {RangeError} if `d == 0`.
 * @returns {bigint} The result of the multiplication and division.
 * @example
 * bigMulDivRound(1000n, 3n, 2n, ROUND_MODES.HALF_AWAY_ZERO) // -> 1500n
 */
export function bigMulDivRound(a: bigint, b: bigint, d: bigint, mode: BigRounding): bigint {
  if (d === BIG_ZERO) {
    throw new RangeError('bigMulDivRound: division by zero')
  }

  let A = a
  let B = b
  let D = d
  let g = bigGcd(A, D)
  A /= g
  D /= g
  g = bigGcd(B, D)
  B /= g
  D /= g

  return bigDivRound(A * B, D, mode)
}

/**
 * Multiply two scaled values and keep `scale` decimals.
 *
 * @param aScaled - a * 10^scale
 * @param bScaled - b * 10^scale
 * @param scale - Decimals to keep.
 * @param mode - Rounding mode. (required)
 * @returns (a * b) * 10^scale rounded.
 *
 * @example
 * // (1.23 * 2.00) with scale=2
 * bigMulScaled(123n, 200n, 2, ROUND_MODES.HALF_AWAY_ZERO) // -> 246n
 */
export function bigMulScaled(aScaled: bigint, bScaled: bigint, scale: number, mode: BigRounding): bigint {
  const denom = bigPow10(scale)
  return bigMulDivRound(aScaled, bScaled, denom, mode)
}

/**
 * Divide two scaled values and keep `scale` decimals.
 *
 * @param aScaled - numerator at `scale`.
 * @param bScaled - denominator at `scale` (≠ 0).
 * @param scale - Decimals to keep.
 * @param mode - Rounding mode. (required)
 * @returns (a / b) * 10^scale rounded.
 * @throws RangeError if `bScaled == 0`.
 *
 * @example
 * // (1.00 / 3.00) with scale=6
 * bigDivScaled(1_000_000n, 3_000_000n, 6, ROUND_MODES.HALF_AWAY_ZERO) // -> 333333n
 */
export function bigDivScaled(aScaled: bigint, bScaled: bigint, scale: number, mode: BigRounding): bigint {
  if (bScaled === BIG_ZERO) {
    throw new RangeError('bigDivScaled: division by zero')
  }

  // aScaled * bigPow10(scale) before division, which could overflow for large values or large scales. Consider using the GCD reduction approach similar to bigMulDivRound.
  // ? not targeting very very large values, so not a problem
  return bigMulDivRound(aScaled * bigPow10(scale), BIG_ONE, bScaled, mode)
}

/**
 * Integer square root: floor(sqrt(n)).
 * @param n - Must be ≥ 0.
 * @returns floor(√n)
 * @throws RangeError if `n < 0`.
 *
 * @example
 * bigSqrtInt(15n) // -> 3n
 * bigSqrtInt(16n) // -> 4n
 */
export function bigSqrtInt(n: bigint): bigint {
  if (n < BIG_ZERO) {
    throw new RangeError('bigSqrtInt: input must be ≥ 0')
  }

  if (n < BIG_TWO) {
    return n
  }

  let x1 = n
  let x0: bigint

  do {
    x0 = x1
    x1 = (x0 + n / x0) >> BIG_ONE
  } while (x1 < x0)

  return x0
}

/**
 * Square root for scaled values: returns a value at the **same scale**.
 *
 * Internally computes sqrt(x * 10^scale) with rounding to nearest unless `DOWN/UP/TRUNC`.
 *
 * @param xScaled - Input at `scale` (≥ 0).
 * @param scale - Decimals of input and output.
 * @param mode - Rounding for midpoints. (required)
 * @returns sqrt(x) at `scale`.
 * @throws RangeError if `xScaled < 0`.
 *
 * @example
 * // sqrt(2.00) at scale=6
 * bigSqrtScaled(2_000_000n, 6, ROUND_MODES.HALF_EVEN) // ~> 1_414_213n
 */
export function bigSqrtScaled(xScaled: bigint, scale: number, mode: BigRounding): bigint {
  if (xScaled < BIG_ZERO) {
    throw new RangeError('bigSqrtScaled: xScaled must be ≥ 0')
  }

  if (xScaled === BIG_ZERO) {
    return BIG_ZERO
  }

  const base = bigPow10(scale)
  const wide = xScaled * base
  const s = bigSqrtInt(wide)

  if (mode === ROUND_MODES.TRUNC || mode === ROUND_MODES.DOWN) {
    return s
  }

  if (mode === ROUND_MODES.UP && s * s < wide) {
    return s + BIG_ONE
  }

  const s2 = s * s
  const next = s + BIG_ONE
  const next2 = next * next
  const distToS2 = bigAbs(s2 - wide)
  const distToNext2 = bigAbs(next2 - wide)

  if (distToNext2 < distToS2) {
    return next
  }

  if (distToS2 < distToNext2) {
    return s
  }

  // midpoint between two squares
  switch (mode) {
    case ROUND_MODES.HALF_AWAY_ZERO:
    case ROUND_MODES.HALF_CEILING:
      return next
    case ROUND_MODES.HALF_TOWARDS_ZERO:
    case ROUND_MODES.HALF_FLOOR:
      return s
    case ROUND_MODES.HALF_EVEN:
      return (s & BIG_ONE) === BIG_ZERO ? s : next
    default:
      return s
  }
}

/**
 * Integer power for scaled base: (base^exp) at the same `scale`.
 * Negative exponents are supported via reciprocal, rounded by `mode`.
 *
 * @param baseScaled - Base at `scale`.
 * @param exp - Integer exponent (can be negative).
 * @param scale - Decimals.
 * @param mode - Rounding for intermediate products and reciprocal. (required)
 * @returns base^exp at `scale`.
 *
 * @example
 * // (1.05)^3 at scale=4
 * bigPowIntScaled(10500n, 3n, 4, ROUND_MODES.HALF_AWAY_ZERO) // -> 11576n  (~1.1576)
 */
export function bigPowIntScaled(baseScaled: bigint, exp: bigint, scale: number, mode: BigRounding): bigint {
  const base = bigPow10(scale)
  if (exp === BIG_ZERO) {
    return base
  }

  if (exp < BIG_ZERO) {
    const pos = bigPowIntScaled(baseScaled, -exp, scale, mode)
    return bigMulDivRound(base * base, BIG_ONE, pos, mode) // scaled reciprocal
  }

  let res = base
  let b = baseScaled
  let e = exp

  while (e > BIG_ZERO) {
    if (e & BIG_ONE) {
      res = bigMulScaled(res, b, scale, mode)
    }
    e >>= BIG_ONE
    if (e) {
      b = bigMulScaled(b, b, scale, mode)
    }
  }

  return res
}
