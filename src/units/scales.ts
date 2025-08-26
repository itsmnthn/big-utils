import type { BigRounding } from '../rounding'
import { trimTrailingZeros } from '../formatter'
import { bigRescale, bigScale, bigUnscale } from '../scaling'

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

/**
 * Converts a scaled integer (base units) to a human-readable decimal string,
 * trimming unnecessary trailing zeros after the decimal point.
 *
 * @param value - The value to unscale, as a bigint or a string representing an integer in base units.
 *   For example, '112000000000000000000' with decimals=18 represents 112.
 * @param decimals - The number of decimal places the value is scaled by (i.e., the number of digits after the decimal point in the original value).
 *   For example, 18 for most ERC-20 tokens.
 * @returns The unscaled value as a string, with trailing zeros after the decimal point removed.
 *
 * @example
 * unScale(112000000000000000000n, 18) // '112'
 * unScale('112000000000000000000', 18) // '112'
 * unScale(123450000n, 6) // '123.45'
 * unScale('1000000', 6) // '1'
 */
export function unScale(value: bigint | string, decimals: number): string {
  return trimTrailingZeros(bigUnscale(BigInt(value), decimals, decimals))
}

/**
 * Converts a scaled integer value from one decimal precision to another, returning the result as a bigint.
 * Useful for converting between different token decimal standards or for rescaling values for calculations.
 *
 * @param value - The value to rescale, as a bigint or a string representing an integer in base units.
 *   For example, '69000000000000000000' with decimals=18 represents 69.
 * @param decimals - The current number of decimal places the value is scaled by.
 *   For example, 18 for most ERC-20 tokens.
 * @param newDecimals - The target number of decimal places to rescale to.
 *   For example, 6 to convert to a token with 6 decimals.
 * @param mode - (Optional) Rounding mode to use if precision is lost during rescaling.
 *   If not provided, the default rounding mode from bigRescale is used.
 * @returns The rescaled value as a bigint.
 *
 * @example
 * unScaleToBase(69000000000000000000n, 18, 6) // 69000000n
 * unScaleToBase(69n, 0, 0) // 69n
 * unScaleToBase('123456789', 8, 2) // 1234568n
 */
export function unScaleToBase(
  value: bigint | string,
  decimals: number,
  newDecimals: number,
  mode?: BigRounding,
): bigint {
  value = BigInt(value)
  return bigRescale(value, decimals, newDecimals, mode)
}
