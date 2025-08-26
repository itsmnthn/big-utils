import { BIG_TEN, BIG_ZERO, POW10_MAX } from '../utils/zro'

/**
 * Absolute value for BigInt.
 * @param a - Input bigint.
 * @returns |a|.
 *
 * @example
 * bigAbs(-12n) // -> 12n
 */
export function bigAbs(a: bigint): bigint {
  return a < BIG_ZERO ? -a : a
}

/**
 * Clamp a BigInt between bounds.
 * @param x - Value.
 * @param lo - Lower bound.
 * @param hi - Upper bound.
 * @returns `lo` if `x < lo`, `hi` if `x > hi`, else `x`.
 *
 * @example
 * bigClamp(15n, 0n, 10n) // -> 10n
 */
export function bigClamp(x: bigint, lo: bigint, hi: bigint): bigint {
  return x < lo ? lo : x > hi ? hi : x
}

/**
 * Returns the smaller of two BigInt values.
 *
 * @param a - First bigint value.
 * @param b - Second bigint value.
 * @returns The lesser of `a` and `b`.
 *
 * @example
 * bigMin(5n, 10n) // -> 5n
 * bigMin(-3n, -7n) // -> -7n
 */
export function bigMin(a: bigint, b: bigint): bigint {
  return a < b ? a : b
}

/**
 * Returns the larger of two BigInts.
 *
 * @param a - First bigint value.
 * @param b - Second bigint value.
 * @returns The greater of `a` and `b`.
 *
 * @example
 * bigMax(5n, 10n) // -> 10n
 * bigMax(-3n, -7n) // -> -3n
 */
export function bigMax(a: bigint, b: bigint): bigint {
  return a > b ? a : b
}

/**
 * Greatest common divisor (Euclid).
 * Safe for negative inputs.
 *
 * @example
 * bigGcd(8n, 12n)   // -> 4n
 * bigGcd(-8n, 12n)  // -> 4n
 */
export function bigGcd(a: bigint, b: bigint): bigint {
  let x = bigAbs(a)
  let y = bigAbs(b)

  while (y) {
    const t = x % y
    x = y
    y = t
  }

  return x
}

/**
 * Compute 10^k as BigInt.
 *
 * @param k - Non-negative exponent (0 ≤ k ≤ 2000).
 * @returns 10^k as BigInt.
 * @throws RangeError if k < 0 or k > 2000.
 *
 * @example
 * bigPow10(0) // -> 1n
 * bigPow10(3) // -> 1000n
 */
export function bigPow10(k: number | bigint): bigint {
  const kk = typeof k === 'number' ? BigInt(Math.trunc(k)) : k
  if (kk < BIG_ZERO) {
    throw new RangeError('bigPow10: exponent must be ≥ 0')
  }

  if (kk > POW10_MAX) {
    throw new RangeError(`bigPow10: exponent must be ≤ ${POW10_MAX}`)
  }

  return BIG_TEN ** kk
}

/**
 * Determines the sign of a bigint value.
 * -  0 if the value is zero,
 * -  1 if the value is positive,
 * - -1 if the value is negative.
 *
 * @param num - The bigint value to check.
 * @returns {0 | 1 | -1} The sign of the input: 0 (zero), 1 (positive), or -1 (negative).
 *
 * @example
 * bigSign(0n)      // 0
 * bigSign(-1234n)  // -1
 * bigSign(9876n)   // 1
 */
export function bigSign(num: bigint): -1 | 0 | 1 {
  return num === BIG_ZERO ? 0 : num > BIG_ZERO ? 1 : -1
}
