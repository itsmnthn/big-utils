import type { AnyNumber, BigRounding } from '../arithmetic/index'
import { bigMulDivRound, ROUND_MODES } from '../arithmetic/index'
import { bigPow10 } from '../core/index'

const BIG_ZERO = BigInt(0)
const BIG_ONE = BigInt(1)

// ===================================================================================
// Price <-> SqrtPrice Conversion
// For converting between human-readable decimal prices and the Q-format fixed-point
// square root price representations used in many AMMs (e.g., Uniswap V3).
//
// Background:
// - Many CLMMs store sqrt(price) in a fixed-point "Q" format (e.g., Q64.64, Q96.96).
// - If sqrtQ is stored with `sqrtBits` fractional bits, the underlying real price is:
//     price_real = (sqrtQ / 2^sqrtBits)^2 * 10^(decimalsDelta)
//   where `decimalsDelta = tokenADecimals - tokenBDecimals` if price = tokenA/tokenB.
// - We typically want the price returned as an integer scaled by 10^outScale for UI.
//
// Notation used below:
// - `sqrtBits`: number of fractional bits of the sqrtQ format (e.g., 64 or 96).
// - `decimalsDelta`: tokenA.decimals - tokenB.decimals (can be negative).
// - `outScale`: number of decimals the returned bigint is scaled to.
// ===================================================================================

/**
 * Compute a scaled price from a fixed-point square root price (Q-format).
 *
 * Formula:
 *   price_scaled = round_{mode}(
 *     (sqrtQ^2 * 10^(decimalsDelta + outScale)) / 2^(2 * sqrtBits)
 *   )
 *
 * - If `decimalsDelta` is negative, we move that factor into the denominator to avoid
 *   calling 10^k with a negative exponent (purely an implementation detail).
 *
 * @param {AnyNumber} sqrtQ
 *   The fixed-point sqrt price as an integer (e.g., Q64 or Q96 format). Must be ≥ 0.
 *   **Important:** This is the raw integer representation (not a decimal string).
 *
 * @param {number} [sqrtBits]
 *   Number of fractional bits in the Q-format (e.g., 64 or 96). Must be a positive integer.
 *
 * @param {number} [decimalsDelta]
 *   Decimal exponent difference = tokenADecimals - tokenBDecimals. Can be negative.
 *   Use this so that price represents tokenA per tokenB at the chosen scale.
 *
 * @param {number} [outScale]
 *   Number of decimals for the returned price (i.e., result is scaled by 10^outScale).
 *   Must be a non-negative integer.
 *
 * @param {BigRounding} [mode]
 *   Rounding for the final division (recommend `ROUND_MODES.HALF_EVEN` for neutrality).
 *
 * @returns {bigint}
 *   Price scaled by 10^outScale.
 *
 * @throws {RangeError}
 *   If `sqrtBits <= 0`, `outScale < 0`, or `sqrtQ < 0`.
 *
 * @example
 * // Example: Q64.64 sqrt price to a human price (USDC 6, APT 8 → decimalsDelta = 8 - 6 = 2)
 * const sqrtQ64 = 18446744073709551616n; // 2^64 (i.e., sqrt(price)=1.0 in Q64)
 * bigPriceFromSqrtQ64(sqrtQ64, 2, 6) // -> 1_000_000n (i.e., 1.000000 with outScale=6)
 */
export function bigPriceFromSqrt(
  sqrtQ: AnyNumber,
  sqrtBits: number = 64,
  decimalsDelta: number = 0,
  outScale: number = 8,
  mode: BigRounding = 'half_even',
): bigint {
  if (!Number.isInteger(sqrtBits) || sqrtBits <= 0)
    throw new RangeError('sqrtBits must be a positive integer (e.g., 64 or 96)')
  if (!Number.isInteger(outScale) || outScale < 0)
    throw new RangeError('outScale must be a non-negative integer')

  // sqrtQ is stored as an integer in Q{sqrtBits} space (must be non-negative).
  const s = typeof sqrtQ === 'bigint' ? sqrtQ : BigInt(String(sqrtQ).trim())
  if (s < BIG_ZERO)
    throw new RangeError('sqrtQ must be non-negative')

  // Numerator/denominator of: (s^2 / 2^(2*sqrtBits)) * 10^(decimalsDelta + outScale)
  const num = s * s
  const den = BIG_ONE << BigInt(2 * sqrtBits)

  if (decimalsDelta >= 0) {
    // price_scaled = (s^2 * 10^(decimalsDelta + outScale)) / 2^(2*sqrtBits)
    const pow = bigPow10(decimalsDelta + outScale)
    return bigMulDivRound(num, pow, den, mode)
  }
  else {
    // price_scaled = (s^2 * 10^outScale) / (2^(2*sqrtBits) * 10^(-decimalsDelta))
    const numPow = bigPow10(outScale)
    const denPow = den * bigPow10(-decimalsDelta)
    return bigMulDivRound(num, numPow, denPow, mode)
  }
}

/**
 * Convenience: compute price (scaled) from a Q64.64 sqrt price.
 *
 * @param {AnyNumber} sqrtQ64 - Q64.64 sqrt price (integer).
 * @param {number} decimalsDelta - tokenA.decimals - tokenB.decimals.
 * @param {number} [outScale] - Output scale for price.
 * @param {BigRounding} [mode] - Rounding mode for final division.
 * @returns {bigint} Price scaled by 10^outScale.
 *
 * @example
 * bigPriceFromSqrtQ64(2n ** 64n, 0, 6) // -> 1_000_000n
 */
export function bigPriceFromSqrtQ64(
  sqrtQ64: AnyNumber,
  decimalsDelta: number,
  outScale = 8,
  mode: BigRounding = ROUND_MODES.HALF_EVEN,
): bigint {
  return bigPriceFromSqrt(sqrtQ64, 64, decimalsDelta, outScale, mode)
}

/**
 * Convenience: compute price (scaled) from a Q96.96 sqrt price.
 *
 * @param {AnyNumber} sqrtQ96 - Q96.96 sqrt price (integer).
 * @param {number} decimalsDelta - tokenA.decimals - tokenB.decimals.
 * @param {number} [outScale] - Output scale for price.
 * @param {BigRounding} [mode] - Rounding mode for final division.
 * @returns {bigint} Price scaled by 10^outScale.
 */
export function bigPriceFromSqrtQ96(
  sqrtQ96: AnyNumber,
  decimalsDelta: number,
  outScale = 8,
  mode: BigRounding = ROUND_MODES.HALF_EVEN,
): bigint {
  return bigPriceFromSqrt(sqrtQ96, 96, decimalsDelta, outScale, mode)
}
