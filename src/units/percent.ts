import type { AnyNumber } from '../arithmetic/index'
import { bigMulDivTrunc } from '../arithmetic/index'
import { bigPow10 } from '../core/index'
import { bigScale } from '../scaling/index'
import { BIG_ZERO } from '../utils/zro'

// A percentage or multiplier is internally represented with 4 decimals of precision.
// e.g., 1% = 10000n, 2.5% = 25000n, 100% = 1000000n
// A multiplier of 1x = 10000n, 2.5x = 25000n
const PRECISION_SCALE = 4
const ONE_HUNDRED_PERCENT = bigPow10(PRECISION_SCALE + 2) // 100 scaled by 4 decimals = 1,000,000n
const ONE_AS_MULTIPLIER = bigPow10(PRECISION_SCALE) // 1 scaled by 4 decimals = 10,000n

/**
 * Calculates a percentage of a total amount.
 *
 * @param totalAmount The total amount, as a scaled BigInt.
 * @param percent The percentage to calculate (e.g., 25.5 for 25.5%).
 * @returns The resulting amount, scaled to the same decimals as `totalAmount`.
 *
 * @example
 * // 25% of 200 (at 8 decimals)
 * calcPercentOf(200_00000000n, 25) // returns 50_00000000n
 */
export function calcPercentOf(
  totalAmount: AnyNumber,
  percent: AnyNumber,
): bigint {
  const amount = BigInt(totalAmount)
  const p_scaled = bigScale(percent, PRECISION_SCALE)

  if (amount === BIG_ZERO || p_scaled === BIG_ZERO) {
    return BIG_ZERO
  }

  return bigMulDivTrunc(amount, p_scaled, ONE_HUNDRED_PERCENT)
}

/**
 * Calculates what percentage one amount is of a total amount.
 * The result is a scaled BigInt. Use `unScale` to format for display.
 *
 * @param partAmount The partial amount, scaled by `amountDecimals`.
 * @param totalAmount The total amount, scaled by `amountDecimals`.
 * @returns The percentage, scaled by `PRECISION_SCALE`.
 *
 * @example
 * // 50 is what percent of 200? -> 25%
 * calcPercentFrom(50_00000000n, 200_00000000n) // returns 250000n (25.0000)
 */
export function calcPercentFrom(
  partAmount: AnyNumber,
  totalAmount: AnyNumber,
): bigint {
  const part = BigInt(partAmount)
  const total = BigInt(totalAmount)

  if (part === BIG_ZERO || total === BIG_ZERO) {
    return BIG_ZERO
  }

  return bigMulDivTrunc(part, ONE_HUNDRED_PERCENT, total)
}

/**
 * Increases an amount by a given percentage.
 *
 * @param amount The initial amount, as a scaled BigInt.
 * @param percent The percentage to increase by (e.g., 10.5 for 10.5%).
 * @returns The increased amount, scaled to the same decimals as `amount`.
 */
export function increaseByPercent(
  amount: AnyNumber,
  percent: AnyNumber,
): bigint {
  const amt = BigInt(amount)
  const percentValue = calcPercentOf(amt, percent)
  return amt + percentValue
}

/**
 * Decreases an amount by a given percentage.
 *
 * @param amount The initial amount, as a scaled BigInt.
 * @param percent The percentage to decrease by (e.g., 10.5 for 10.5%).
 * @returns The decreased amount, scaled to the same decimals as `amount`.
 */
export function decreaseByPercent(
  amount: AnyNumber,
  percent: AnyNumber,
): bigint {
  const amt = BigInt(amount)
  const percentValue = calcPercentOf(amt, percent)
  return amt - percentValue
}

/**
 * Multiplies an amount by a factor (e.g., 2x, 3.5x).
 *
 * @param amount The initial amount, as a scaled BigInt.
 * @param factor The factor to multiply by (e.g., 2.5 for 2.5x).
 * @returns The resulting amount.
 */
export function multiplyByFactor(
  amount: AnyNumber,
  factor: AnyNumber,
): bigint {
  const amt = BigInt(amount)
  const m_scaled = bigScale(factor, PRECISION_SCALE)

  return bigMulDivTrunc(amt, m_scaled, ONE_AS_MULTIPLIER)
}

/**
 * Divides an amount by a factor (e.g., 2x, 4x).
 *
 * @param amount The initial amount, as a scaled BigInt.
 * @param factor The factor to divide by (e.g., 2.5 for 2.5x).
 * @returns The resulting amount.
 */
export function divideByFactor(
  amount: AnyNumber,
  factor: AnyNumber,
): bigint {
  const amt = BigInt(amount)
  const d_scaled = bigScale(factor, PRECISION_SCALE)

  if (d_scaled <= BIG_ZERO) {
    throw new RangeError('Divisor must be positive')
  }

  return bigMulDivTrunc(amt, ONE_AS_MULTIPLIER, d_scaled)
}
