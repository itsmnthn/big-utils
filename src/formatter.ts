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
 * Removes trailing zeros from the fractional part of a numeric string or number.
 *
 * - If the input has no decimal point, returns the string representation unchanged.
 * - If the fractional part is all zeros, removes the decimal point as well.
 * - Otherwise, trims only the unnecessary trailing zeros after the decimal.
 *
 * @param {string | number} value - The numeric value or string to process.
 * @returns {string} The value as a string with trailing zeros in the fractional part removed.
 *
 * @example
 * trimTrailingZeros(100.0000)      // '100'
 * trimTrailingZeros(0.1000)        // '0.1'
 * trimTrailingZeros('100.1234')    // '100.1234'
 * trimTrailingZeros('299.')        // '299'
 * trimTrailingZeros(-100.324000)   // '-100.324'
 * trimTrailingZeros(100)           // '100'
 */
export function trimTrailingZeros(value: string | number): string {
  value = value.toString()
  const dotIndex = value.indexOf('.')

  // If there's no decimal point, return the original string representation
  if (dotIndex === -1)
    return value

  // Find the index where trailing zeros stop
  let endIndex = value.length - 1
  while (value[endIndex] === '0')
    endIndex--

  // If all characters after the dot are zeros, omit the dot as well
  if (endIndex === dotIndex)
    return value.substring(0, dotIndex)

  // Return the string up to the last non-zero character
  return value.substring(0, endIndex + 1)
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
