import type { BigRounding } from '../rounding'
import { bigScale } from '../scaling'

/**
 * Scales a numeric value by multiplying it with 10 raised to the power of `decimals`, returning the result as a BigInt.
 * Accepts numbers, strings (including decimals and scientific notation), or BigInt values.
 * Optionally, a rounding mode can be specified for handling fractional values.
 *
 * @param value - The input value to scale. Can be a string, number, or bigint.
 * @param decimals - The number of decimal places to scale by (i.e., the exponent for 10).
 * @param mode - (Optional) Rounding mode to use if the input has more precision than `decimals`.
 * @returns The scaled value as a BigInt.
 *
 * @example
 * scale('112', 18) // 112000000000000000000n
 * scale(112, 18) // 112000000000000000000n
 * scale(112.5632, 0) // 113n
 * scale(112.5632, 0, ROUND_MODES.TRUNC ) // 112n // 'HALF_AWAY_ZERO' is the default rounding mode
 * scale('1.234e2', 4) // 1234000n
 */
export function scale(value: string | number | bigint, decimals: number, mode?: BigRounding) {
  return bigScale(value, decimals, mode)
}
