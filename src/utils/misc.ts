/**
 * Shortens a string by removing characters from the middle and replacing them with an ellipse.
 *
 * @param value The string to shorten
 * @param startCount The number of characters to keep at the start of the string
 * @param endCount The number of characters to keep at the end of the string
 * @param ellipse The string to use as the ellipse (default: '...')
 *
 * @returns The shortened string
 *
 * @example
 * shortenString('0x7a7a7229292286592739473748234343434532345', 4, 4) // '0x7a...2345'
 * shortenString('0x7a7a7229292286592739473748234343434532345', 4, 4, '***') // '0x7a***2345'
 * shortenString('0x7a7a7229292286592739473748234343434532345', 6, 4, '...') // '0x7a7a...2345'
 */
export function shortenString(value: string, startCount = 4, endCount = 4, ellipse = '...') {
  if (value.length > startCount + endCount)
    return value.slice(0, startCount) + ellipse + value.slice(-endCount)

  return value
}

export function simulateAsyncPause(duration = 1000) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), duration)
  })
}

export function range(start: number, stop: number, step = 1): number[] {
  if (step <= 0)
    return []

  // Correctly calculate the number of elements in the range.
  const size = Math.ceil((stop - start + 1) / step)
  const result: number[] = Array.from({ length: size })

  for (let i = 0; i < size; i++)
    result[i] = start + i * step

  return result
}

/**
 * Timestamped id with random string with timestamp
 */
export function getTimestampedID() {
  return (Math.random().toString(36) + Date.now().toString(36)).slice(2)
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
 * Formats a time object to a string with days, hours, minutes, and seconds.
 *
 * @param time - The time object with days, hours, minutes, and seconds.
 * @param time.days - The number of days. Defaults to 0.
 * @param time.hours - The number of hours. Defaults to 0.
 * @param time.mins - The number of minutes. Defaults to 0.
 * @param time.secs - The number of seconds. Defaults to 0.
 * @param negative - If true, allows for a negative result. A single '-' sign is prepended
 * to the entire string if *any* of the time components are negative. Defaults to false.
 *
 * @returns The formatted time string, or an empty string if any component is negative
 * and the `negative` parameter is false.
 *
 * @example
 * formatTime({ days: 1, hours: 2, mins: 3, secs: 4 })      // '1d 2h 3m 4s'
 * formatTime({ days: -1, hours: 2, mins: 3, secs: 4 }, true) // '-1d 2h 3m 4s'
 * formatTime({ days: 0, hours: 0, mins: 3, secs: 4 })      // '3m 4s'
 * formatTime({ days: 0, hours: 0, mins: 0, secs: 4 })      // '4s'
 * formatTime({ days: -1, hours: -2 }, true)                // '-1d 2h'
 * formatTime({ days: -1, hours: 2 })                       // ''
 */
export function formatTime(
  { days = 0, hours = 0, mins = 0, secs = 0 }: { days?: number, hours?: number, mins?: number, secs?: number },
  negative = false,
): string {
  const hasNegativeComponent = days < 0 || hours < 0 || mins < 0 || secs < 0

  // If any component is negative and 'negative' is not allowed, return an empty string.
  if (hasNegativeComponent && !negative) {
    return ''
  }

  const sign = hasNegativeComponent ? '-' : ''

  let timeString = ''
  timeString += days ? `${Math.abs(days)}d ` : ''
  timeString += hours ? `${Math.abs(hours)}h ` : ''
  timeString += mins ? `${Math.abs(mins)}m ` : ''
  timeString += secs ? `${Math.abs(secs)}s` : ''

  return sign + timeString.trim()
}
