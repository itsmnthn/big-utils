import { formatNumberCompact, formatWithComma, shortenDecimals } from '../formatter'
import { scale } from './scale'
import { unScale } from './unscale'

export const ZERO = BigInt(0)
export const ZERO_FORMATTED = { base: ZERO, formatted: '0', display: '0' }

export interface FormattedAmount {
  base: bigint
  display: string
  formatted: string
}

/**
 * un-scales unit with give decimals and returns
 * @returns base: original value, display: unScaled value with 0-3 decimals with comma, formatted: unScaled value with all decimals
 * @example
 * getFormattedAmount('12345678900223', 6, 3) // { base: 12345678900223n, display: '12,345,678.9', formatted: '12345678.900223' }
 */
export function formatAmount(value: bigint | string, decimals: number, displayDecimals = 3) {
  const valueUnScaled = unScale(value, decimals)

  return {
    base: BigInt(value),
    display: formatWithComma(shortenDecimals(valueUnScaled, displayDecimals)),
    formatted: valueUnScaled,
  }
}

/**
 * Format an amount to a compact string (e.g. 1000 to 1K, 1000000 to 1M)
 * @param value - The amount to format.
 * @param decimals - The number of decimals the amount is scaled by.
 * @param displayDecimals - The number of decimals to display.
 * @param minNum - Whether to display the minimum number.
 * @param minValue - The minimum value to display the compact format.
 * @returns The formatted amount.
 * @example
 * formatAmountCompact('20000000000', 6, 9999, 3) // { base: 20000000000n, display: '20K', formatted: '20000' }
 */
export function formatAmountCompact(
  value: bigint | string,
  decimals: number,
  displayDecimals = 3,
  minNum = true,
  minValue = 9999,
): FormattedAmount {
  const base = BigInt(value)
  const valueUnScaled = unScale(value, decimals)

  if (base > scale(minValue, decimals)) {
    return {
      base,
      display: shortenDecimals(formatNumberCompact(valueUnScaled), displayDecimals, minNum),
      formatted: valueUnScaled,
    }
  }

  let displayValue: string

  if (base > scale(minValue, decimals)) {
    // The compact formatter itself handles the number of decimals.
    displayValue = formatNumberCompact(valueUnScaled, { maximumFractionDigits: displayDecimals })
  }
  else {
    // First, shorten/format the decimals, then add commas.
    const shortened = shortenDecimals(valueUnScaled, displayDecimals, minNum)
    displayValue = formatWithComma(shortened)
  }

  return {
    base,
    display: displayValue,
    formatted: valueUnScaled,
  }
}
