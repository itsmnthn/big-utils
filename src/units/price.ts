import { bigMulDivTrunc } from '../arithmetic/index'
import { bigAbs, bigPow10 } from '../core/index'
import { BIG_ZERO } from '../utils/zro'

/**
 * Calculates the total price from the number of units and the price per unit.
 * The result is always scaled to `priceDecimals`.
 *
 * Formula: totalPrice = (units * unitPrice) / 10^unitDecimals
 *
 * @param units The number of units, scaled by `unitDecimals`.
 * @param unitPrice The price per unit, scaled by `priceDecimals`.
 * @param unitDecimals The number of decimals for the `units` amount. Default is 8.
 * @param _priceDecimals The number of decimals for `unitPrice` and the output. Default is 6.
 *   essential parameter to prepare the inputs and interpret the output.
 * @returns The total price, scaled by `priceDecimals`.
 *
 * @example
 * // 1 APT (1e8) * $4.535356 (4535356 @ 6dp) = $4.535356
 * calcTotalPrice(100000000n, 4535356n, 8, 6) // returns 4535356n
 */
export function calcTotalPrice(
  units: string | bigint,
  unitPrice: string | bigint,
  unitDecimals = 8,
  _priceDecimals = 6,
): bigint {
  const u = BigInt(units) // Allow negative units
  const p = bigAbs(BigInt(unitPrice)) // Price is always a positive magnitude

  if (u === BIG_ZERO || p === BIG_ZERO) {
    return BIG_ZERO
  }

  if (unitDecimals <= 0) {
    throw new RangeError('unitDecimals must be a non-negative integer')
  }

  const divisor = bigPow10(unitDecimals)
  return bigMulDivTrunc(u, p, divisor)
}

/**
 * Calculates the price per unit from the total price and number of units.
 * The result is always scaled to `priceDecimals`.
 *
 * Formula: unitPrice = (totalPrice * 10^unitDecimals) / units
 *
 * @param totalPrice The total price, scaled by `priceDecimals`.
 * @param units The number of units, scaled by `unitDecimals`.
 * @param unitDecimals The number of decimals for the `units` amount. Default is 8.
 * @param _priceDecimals The number of decimals for `unitPrice` and the output. Default is 6.
 *   essential parameter to prepare the inputs and interpret the output.
 * @returns The price per unit, scaled by `priceDecimals`.
 *
 * @example
 * // $10.00 total price / 2 units = $5.00 unit price
 * calcUnitPrice('10000000', '200000000', 2, 8) // returns 5000000n
 */
export function calcUnitPrice(
  totalPrice: string | bigint,
  units: string | bigint,
  unitDecimals = 8,
  _priceDecimals = 6,
): bigint {
  // Unit price is a magnitude, so we use the absolute values.
  const tp = bigAbs(BigInt(totalPrice))
  const u = bigAbs(BigInt(units))

  if (tp === BIG_ZERO || u === BIG_ZERO) {
    return BIG_ZERO
  }

  if (unitDecimals <= 0) {
    throw new RangeError('unitDecimals must be a non-negative integer')
  }

  // The priceDecimals for totalPrice and the output unitPrice cancel out,
  // so we only need to scale by the unitDecimals to normalize the values.
  const multiplier = bigPow10(unitDecimals)
  return bigMulDivTrunc(tp, multiplier, u)
}

/**
 * Calculates the number of units from the total price and price per unit.
 * The result is always scaled to `unitDecimals`.
 *
 * Formula: units = (totalPrice * 10^unitDecimals) / unitPrice
 *
 * @param totalPrice The total price, scaled by `priceDecimals`.
 * @param unitPrice The price per unit, scaled by `priceDecimals`.
 * @param unitDecimals The number of decimals for the output. Default is 8.
 * @param _priceDecimals The number of decimals for `unitPrice` and the output. Default is 6.
 *   essential parameter to prepare the inputs and interpret the output.
 * @returns The number of units, scaled by `unitDecimals`.
 *
 * @example
 * // $12.00 total price / $0.80 unit price = 15 units
 * calcUnits('12000000', '800000', 6, 8) // returns 1500000000n
 */
export function calcUnits(
  totalPrice: string | bigint,
  unitPrice: string | bigint,
  unitDecimals = 8,
  _priceDecimals = 6,
): bigint {
  const tp = BigInt(totalPrice) // Allow negative total price
  const up = bigAbs(BigInt(unitPrice)) // Price is always a positive magnitude

  if (tp === BIG_ZERO || up === BIG_ZERO) {
    return BIG_ZERO
  }

  if (unitDecimals <= 0) {
    throw new RangeError('unitDecimals must be a non-negative integer')
  }

  // The priceDecimals for totalPrice and unitPrice cancel each other out.
  // We only need to scale by the target unitDecimals.
  const multiplier = bigPow10(unitDecimals)
  return bigMulDivTrunc(tp, multiplier, up)
}
