import { absBig } from './bigUtils'
import { ZERO } from './zro'

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
  value = absBig(value)
  minimum = absBig(minimum)

  return value !== ZERO && minimum !== ZERO && value % minimum === ZERO && value >= minimum
}

/**
 * Returns the adjusted value to be a multiple of the minimum value.
 * Both `value` and `minimum` are expected to be strings representing numbers
 * with the same number of decimal places. The adjustment ensures that the returned
 * value is a multiple of the `minimum` and is less than or equal to the original `value`.
 *
 * @param {string} value - The value to adjust, should be in the same decimals as `minimum`.
 * @param {string} minimum - The minimum value to adjust against, should be in the same decimals as `value`.
 * @returns {string} - The adjusted value, in the same decimals as `value`, ensuring it's a multiple of `minimum`.
 *
 * @example
 * reduceByRemainder('123560', '10') // '123560'
 * reduceByRemainder('123560', '11') // '123552'
 */
export function reduceByRemainder(value: string | bigint, minimum: string | bigint) {
  // Convert strings to BigInt for calculation
  value = BigInt(value)
  minimum = BigInt(minimum)

  if (value === ZERO || minimum === ZERO)
    return ZERO

  // Check if value is already a multiple of minimum
  const remainder = value % minimum
  if (remainder === ZERO)
    return value

  return value - remainder
}
