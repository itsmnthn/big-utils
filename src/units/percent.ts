import { scale } from './scale'
import { unScale, unScaleToBase } from './unscale'
import { ZERO } from './zro'

/**
 * Calculates the specified percentage of a given value.
 *
 * @param value - The value to calculate the percentage of
 * @param percentage - The percentage to calculate
 * @param valueDecimals - The decimals of the value.
 *
 * @returns The percentage of the given value scaled according to the specified decimals
 *
 * @example
 * calcPercentValue(100, 10, 6) // 10
 * calcPercentValue(100, 25, 6) // 25
 * calcPercentValue(100e18, 50, 18) // 50000000000000000000n || 50e18
 */
export function calcPercentValue(
  value: string | number | bigint,
  percentage: number | string | bigint,
  valueDecimals: number,
) {
  return unScaleToBase(
    BigInt(value) * scale(percentage, valueDecimals),
    valueDecimals + valueDecimals + 2, // 2 is percentage decimals (100)
    valueDecimals,
  )
}

/**
 * To avoid total loss of precision if the given decimals are not enough in case of more than 100%
 */
const percentCatalyst = 6

/**
 * Calculates the percentage of the given secondary value from the main value
 *
 * @param value - The main value
 * @param secondValue - The secondary value
 * @param decimals - The decimals of the value.
 * @param precision - The precision of the result. Default is 3.
 *
 * @returns The percentage with the given precision
 *
 * @example
 * calcPercentage('100', '10', 2) // 10
 * calcPercentage(50, 75, 0) // 150
 * calcPercentage(BigInt(125e9), '62500000000', 9) // 50
 * calcPercentage('1234567898765432123456789', '617283949382716061728394', 18) // 50
 */
export function calcPercentage(
  value: string | number | bigint,
  secondValue: string | number | bigint,
  decimals: number,
  precision = 3,
) {
  value = BigInt(value)
  secondValue = BigInt(secondValue)
  if (secondValue === ZERO || value === ZERO)
    return 0

  return Number(
    Number(unScale(
      scale(secondValue, decimals + decimals + percentCatalyst) / value,
      decimals + decimals + percentCatalyst - 2,
    )).toFixed(precision),
  )
}

/**
 * Increase a number by given percentage
 *
 * @param value - The number to increasea
 * @param percentage - The percentage to increase by
 * @param decimals - The decimals of the value.
 *
 * @returns The increased number (e.g. 100 + 10% of 100 = 110)
 *
 * @example
 * increaseByPercentage('100', 10, 2) // 110
 * increaseByPercentage('100', 25, 2) // 125
 * increaseByPercentage(-100, 50, 9) // -50
 */
export function increaseByPercentage(value: string | bigint | number, percentage: number | string, decimals: number) {
  value = BigInt(value)
  return value + (calcPercentValue(value, percentage, decimals) * (value < ZERO ? BigInt(-1) : BigInt(1)))
}

/**
 * Decrease a number by given percentage
 *
 * @param value - The number to decrease
 * @param percentage - The percentage to decrease by
 * @param decimals - The decimals of the value.
 *
 * @returns The decreased number (e.g. 100 - 30% of 100 = 70)
 *
 * @example
 * decreaseByPercentage('100', 10, 2) // 90
 * decreaseByPercentage('100', 25, 2) // 75
 * decreaseByPercentage(-100, 50, 9) // -150
 */
export function decreaseByPercentage(value: string | bigint | number, percentage: number | string, decimals: number) {
  value = BigInt(value)
  return value - (calcPercentValue(value, percentage, decimals) * (value < ZERO ? BigInt(-1) : BigInt(1)))
}
