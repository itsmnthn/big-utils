import { bigAbs } from '../core/index'
import { scale, unScale } from '../scaling/index'
import { BIG_ZERO } from '../utils/zro'

/**
 * Compact number formatter using Intl.NumberFormat with a 10k cutoff.
 * - < 10_000: standard (non-compact) formatting
 * - ≥ 10_000: compact formatting (K/M/B/T...)
 *
 * @param value - The numeric value to format.
 * @param options - Optional Intl.NumberFormatOptions to customize formatting.
 * @param locale - Optional BCP 47 language tag for locale formatting.
 * @returns The formatted compact string representation of the number.
 * @throws if a string is not numeric.
 *
 * @example
 * formatNumberCompact(9000) // "9,000" (depending on locale)
 * formatNumberCompact(12000) // "12K" (depending on locale)
 * formatNumberCompact(1500000, { maximumFractionDigits: 1 }) // "1.5M"
 */
export function formatNumberCompact(
  value: number | string | bigint,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 2, notation: 'compact', compactDisplay: 'short' },
  locale?: string,
): string {
  if (typeof value === 'string')
    value = Number(value)

  if (Number(value) < 10_000) {
    // plain formatting, no compact
    return new Intl.NumberFormat(locale, { ...options, notation: 'standard' }).format(value)
  }

  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * Add locale-aware grouping separators to a number/amount.
 * - For strings with decimals, only the integer part is grouped; fraction is preserved verbatim.
 * - For BigInt/Number, Intl does the whole job.
 *
 * @example
 * formatWithComma(1000000)                 // '1,000,000'
 * formatWithComma('1000.34')               // '1,000.34'
 * formatWithComma(1234567890123456789n)    // '1,234,567,890,123,456,789'
 * formatWithComma('000123.4500')           // '123.4500'
 * formatWithComma('1000000.99', 'en-IN')   // '10,00,000.99'
 */
export function formatWithComma(
  amount: string | number | bigint,
  locale: string = 'en-US',
): string {
  // For number and bigint, Intl.NumberFormat handles everything perfectly.
  if (typeof amount === 'number' || typeof amount === 'bigint') {
    if (typeof amount === 'number' && !Number.isFinite(amount)) {
      throw new TypeError('amount must be a finite number')
    }
    return new Intl.NumberFormat(locale, { useGrouping: true }).format(amount)
  }

  // string path: group integer via Intl(BigInt), keep fraction verbatim (no rounding)
  const s = String(amount).trim()
  if (s === '') {
    throw new TypeError('amount must not be empty')
  }

  // handle sign
  const sign = s[0] === '-' ? '-' : s[0] === '+' ? '+' : ''
  const body = sign ? s.slice(1) : s

  // split integer/fraction
  const [intPartRaw, fracPart] = body.split('.')

  // validate digits
  if (!/^\d+$/.test(intPartRaw || '0') || (fracPart !== undefined && !/^\d+$/.test(fracPart))) {
    if (intPartRaw?.startsWith('<') || intPartRaw?.startsWith('>')) {
      return amount
    }
    throw new TypeError('amount string must be a valid numeric literal')
  }

  // format integer with Intl using BigInt to avoid precision loss
  const intBig = BigInt(intPartRaw || '0')
  const intFmt = new Intl.NumberFormat(locale, { useGrouping: true }).format(intBig)

  return sign + (fracPart !== undefined ? `${intFmt}.${fracPart}` : intFmt)
}

/**
 * Return a human-friendly "too small to show" label when |value| is smaller
 * than the smallest unit representable at `decimals`. Otherwise, return the value as a string.
 *
 * Rules
 * - For positives:  0 < x < 10^-d  → "< 0.00…01"
 * - For negatives: -10^-d < x < 0  → "> -0.00…01"
 *   (note the **greater than** sign for negatives, since -0.007 > -0.01)
 *
 * ⚠️ Precision: This function parses via Number, so it’s for display only.
 *    Do not use it for exact math or extremely large/small magnitudes.
 *
 * @param {string|number} value - A numeric string (e.g. "0.009") or a number.
 * @param {number} [decimals] - Number of decimals the UI can represent (must be ≥ 0).
 * @returns {string} The smallest representable unit at the given decimals
 *
 * @example
 * formatSmallest('100', 2)      // '100'
 * formatSmallest('0.009', 2)    // '< 0.01'
 * formatSmallest('-0.007', 2)   // '> -0.01'
 * formatSmallest(0.0000003, 6)  // '< 0.000001'
 * formatSmallest(-0.4, 0)       // '> -1'
 */
export function formatSmallest(value: string | number, decimals = 4): string {
  // Validate decimals
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError('decimals must be a non-negative integer')
  }

  // Parse input (display-only precision)
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) {
    throw new TypeError('value must be a finite number (string or number)')
  }

  if (n === 0) {
    return '0'
  }

  // The smallest representable unit at the given decimals
  // e.g., d=2 → unit=0.01, label="0.01"
  const unit = decimals === 0 ? 1 : 1 / 10 ** decimals
  const unitLabel = decimals === 0 ? '1' : `0.${'0'.repeat(decimals - 1)}1`

  // Positive: show "< unit" if smaller than the unit
  if (n > 0 && n < unit) {
    return `< ${unitLabel}`
  }

  // Negative: show "> -unit" if closer to zero than -unit
  if (n < 0 && -n < unit) {
    return `> -${unitLabel}`
  }

  // Otherwise, just echo back
  return String(n)
}

/**
 * Shorten the decimal part of a number or amount string
 * @example
 * shortenDecimals(100.123456789) // '100.123'
 * shortenDecimals('100.123456789', 2) // '100.12'
 * shortenDecimals('100.123456789', 2, true) // '100.12'
 */
export function shortenDecimals(value: string | number, decimals = 3, minNum = false) {
  if (!Number.isInteger(decimals) || decimals < 0) {
    throw new RangeError('decimals must be a non-negative integer')
  }

  const x = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(x)) {
    throw new TypeError('value must be a finite number')
  }

  if (minNum) {
    const minAmount = formatSmallest(x, decimals) // if minNum is true, return the minimum value to display
    if (minAmount.startsWith('<') || minAmount.startsWith('>')) {
      return minAmount
    }
  }

  const s = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: decimals, // don't pad zeros unless you want to
    roundingMode: 'trunc', // ← native truncation
    useGrouping: false,
  }).format(x)

  return s === '-0' ? '0' : s
}

export const ZERO_FORMATTED = { base: BIG_ZERO, formatted: '0', display: '0' }

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
 * @param minNum - Whether to pad to the minimum number of fraction digits.
 * @param minValue - The minimum value to display the compact format.
 * @returns The formatted amount.
 * @example
 * formatAmountCompact('20000000000', 6, 3, true) // { base: 20000000000n, display: '20K', formatted: '20000' }
 * formatAmountCompact('2', 6, 3, true) // { base: 2n, display: '< 0.001', formatted: '0.000002' }
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

  if (bigAbs(base) >= scale(minValue, decimals)) {
    return {
      base,
      display: shortenDecimals(formatNumberCompact(valueUnScaled), displayDecimals, minNum),
      formatted: valueUnScaled,
    }
  }

  let displayValue: string

  // First, shorten/format the decimals, then add commas.
  const shortened = shortenDecimals(valueUnScaled, displayDecimals, minNum)
  // If the shortened value includes '<' or '>', it means the value is too small to be displayed in the compact format.
  // In this case, we don't need to add commas.
  if (shortened.includes('<') || shortened.includes('>')) {
    displayValue = shortened
  }
  else {
    displayValue = formatWithComma(shortened)
  }

  return {
    base,
    display: displayValue,
    formatted: valueUnScaled,
  }
}
