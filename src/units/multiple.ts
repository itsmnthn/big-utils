import { bigAbs } from '../core'

const ZERO = BigInt(0)

/**
 * Checks if the given value is a multiple of the specified minimum value.
 * Both the value and the minimum should be represented as strings to maintain precision
 * and should have the same scale (e.g., both represented in wei for Ethereum transactions).
 *
 * @param {string} value - The value to validate, as a string.
 * @param {string} minimum - The minimum value to validate against, as a string.
 * @returns {boolean} - True if the value is a multiple of the minimum and greater than or equal to the minimum value; otherwise, false.
 *
 * @example
 * isMultipleOfMinimum('123560', '10') // true
 * isMultipleOfMinimum('123560', '11') // false
 */
export function isMultipleOfMinimum(value: string | bigint, minimum: string | bigint) {
  // (x != 0 && x % y == 0)
  value = BigInt(value)
  minimum = BigInt(minimum)

  // Work with absolute values for the check
  const absValue = bigAbs(value)
  const absMinimum = bigAbs(minimum)

  // 1. Ensure neither is zero to prevent division errors and invalid states.
  // 2. Check for divisibility using the modulo operator.
  // 3. Ensure the value is at least as large as the minimum (makes intent clear).
  return (
    absValue !== ZERO
    && absMinimum !== ZERO
    && absValue % absMinimum === ZERO
    && absValue >= absMinimum
  )
}

/**
 * Adjusts a value to the nearest multiple of a minimum value, rounding towards zero.
 * This is equivalent to `(value / minimum) * minimum`.
 *
 * @param {string | bigint} value - The value to adjust.
 * @param {string | bigint} minimum - The minimum value to adjust against.
 * @returns {bigint} - The adjusted value, as a multiple of the minimum.
 *
 * @example
 * truncateToMultiple('123560', '10') // 123560n
 * truncateToMultiple('123560', '11') // 123552n
 * truncateToMultiple('-17', '8')     // -16n
 */
export function truncateToMultiple(value: string | bigint, minimum: string | bigint): bigint {
  const val = BigInt(value)
  const min = BigInt(minimum)

  if (val === 0n || min === 0n) {
    return 0n
  }

  const remainder = val % min

  // The expression `val - remainder` is the mathematical definition
  // of truncating division's result multiplied by the divisor.
  return val - remainder
}
