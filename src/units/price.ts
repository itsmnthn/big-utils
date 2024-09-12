import { absBig } from './bigUtils'
import { scale } from './scale'
import { unScaleToBase } from './unscale'
import { ZERO } from './zro'

const precisionCatalyst = 6 // to avoid total loss of precision if the given decimals are not enough

/**
 * Calculates the unit price based on the number of units and total price.
 * @param noAbs pass `true` to allow -ve values for resulted unit price
 * @example
 * calcPrice(BigInt(2e6), BigInt(1e5), 6, 6) // 50000n
 */
export function calcPrice(
  units: string | bigint,
  totalPrice: string | bigint,
  unitDecimals = 18,
  priceDecimals = 6,
  noAbs = false,
) {
  units = BigInt(units)
  totalPrice = BigInt(totalPrice)

  if (units === ZERO || totalPrice === ZERO)
    return ZERO

  if (!noAbs) // in certain cases we want to allow -ve values for units e.g. if it's a debt
    units = absBig(units)

  // to avoid underflow and retain precision
  const priceDecimalsFactor = priceDecimals + priceDecimals + unitDecimals + precisionCatalyst
  return unScaleToBase(
    scale(totalPrice, priceDecimalsFactor) / units,
    priceDecimalsFactor,
    unitDecimals,
  )
}

/**
 * Calculates units based on the total price and number of units.
 * @example
 * calcUnits(BigInt(1e5), BigInt(2e6)) // 50000000000000000n
 * calcUnits('1000', '1200', 2, 2) // 83n === 0.83 * 10^2
 */
export function calcUnits(
  totalPrice: string | bigint,
  unitPrice: string | bigint,
  priceDecimals = 6,
  unitDecimals = 18,
) {
  unitPrice = absBig(unitPrice)
  totalPrice = absBig(totalPrice)
  if (unitPrice === ZERO || totalPrice === ZERO)
    return ZERO

  const priceDecimalsFactor = priceDecimals + priceDecimals + unitDecimals + precisionCatalyst
  return unScaleToBase(
    scale(totalPrice, priceDecimalsFactor) / unitPrice,
    priceDecimalsFactor,
    unitDecimals,
  )
}

/**
 * Calculates the total price based on the number of units and unit price.
 * @param noAbs pass `true` to allow -ve values for resulted total price
 *
 * @example
 * calcTotalPrice('100', '12', 2, 2) // 12n
 * BigInt(2223e17), '12000000', 18, 6) // 2667600000n
 */
export function calcTotalPrice(
  units: string | bigint,
  unitPrice: string | bigint,
  unitDecimals = 18,
  priceDecimals = 6,
  noAbs = false,
) {
  units = BigInt(units)
  unitPrice = BigInt(unitPrice)

  if (units === ZERO || unitPrice === ZERO)
    return ZERO

  if (!noAbs) // in certain cases we want to allow -ve values for units e.g. if it's a debt
    units = absBig(units)

  return unScaleToBase(units * unitPrice, unitDecimals + priceDecimals, priceDecimals)
}
