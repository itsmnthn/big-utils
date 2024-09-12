import { ZERO } from './zro'

/**
 * Gets the sign of a number represented as a string, or bigint.
 * @param num {string | bigint} The number in string or bigint format to be used for deciding the sign.
 * @returns 0 if num is zero, 1 if num is positive, -1 if num is negative.
 */
export function getBigSign(num: string | bigint): -1 | 0 | 1 {
  num = BigInt(num)
  return num === ZERO ? 0 : num > ZERO ? 1 : -1
}

/**
 * Returns the absolute value for a given BigInt
 * @example
 * absBigInt(-1n) // 1n
 * absBigInt(1n) // 1n
 */
export function absBig(num: bigint | string): bigint {
  num = BigInt(num)
  return num < ZERO ? -num : num
}
