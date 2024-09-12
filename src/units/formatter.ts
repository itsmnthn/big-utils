import { unScale } from './unscale'

/**
 * get the smallest decimal string representation if the value is less than what can be represented with the given decimals
 * @warn only works with string which is a valid number and not a string bigint
 * @example
 * getSmallest('100', 2) // '100'
 * getSmallest('0.009', 2) // '< 0.01'
 * getSmallest('-0.007', 2) // '< -0.09'
 */
export function getSmallest(value: string | number, decimals = 4) {
  const numAmount = Number(value)

  const smallestPositive = 1 / 10 ** decimals
  const smallestNegative = -smallestPositive * 9

  if (decimals > 0 && numAmount > 0 && numAmount < smallestPositive)
    return `< 0.${'0'.repeat(decimals - 1)}1`

  if (decimals > 0 && numAmount < 0 && numAmount > smallestNegative)
    return `< -0.${'0'.repeat(decimals - 1)}9`

  return String(numAmount)
}

/**
 * Strip trailing zeros from a number or amount string
 * @example
 * stripTrailingZeros(100.0000) // '100'
 * stripTrailingZeros(0.1000) // '0.1'
 * stripTrailingZeros('100.1234') // '100.1234'
 */
export function stripTrailingZeros(value: string | number) {
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
 * Shorten the decimal part of a number or amount string
 * @example
 * shortenDecimals(100.123456789) // '100.123'
 * shortenDecimals('100.123456789', 2) // '100.12'
 * shortenDecimals('100.123456789', 2, true) // '100.12'
 */
export function shortenDecimals(value: string | number, decimals = 3, minNum = false) {
  value = value.toString()
  if (minNum) {
    const minAmount = getSmallest(value, decimals) // if minNum is true, return the minimum value to display
    if (minAmount !== value)
      return minAmount
  }

  const dotIndex = value.indexOf('.')
  if (dotIndex === -1) // If there's no decimal point, return the original string representation
    return value

  value = stripTrailingZeros(value.substring(0, dotIndex + 1 + decimals))
  if (value === '-0')
    return '0'

  return value
}

/**
 * Add Comma to a number or amount string (e.g. 1000000 to 1,000,000)
 * @example
 * formatWithComma(1000000) // '1,000,000'
 * formatWithComma('1000.34') // '1,000.34'
 */
export function formatWithComma(amount: string | number | bigint) {
  const [integerPart, decimalPart] = amount.toString().split('.')

  // Adding commas to the integer part
  const withCommas = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  // If ignoring decimals, return here
  if (decimalPart === undefined)
    return withCommas

  // Append the decimal part if not ignoring
  return `${withCommas}.${decimalPart}`
}

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
