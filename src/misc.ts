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
 * Formats a time object to a string with days, hours, minutes, and seconds.
 *
 * @param time - The time object with days, hours, minutes, and seconds. Defaults to 0.
 * @param time.days - The number of days.
 * @param time.hours - The number of hours.
 * @param time.mins - The number of minutes.
 * @param time.secs - The number of seconds.
 * @param negative - Whether to allow negative results. Defaults to false.
 *
 * @returns The formatted time string.
 *
 * @example
 * formatTime({ days: 1, hours: 2, mins: 3, secs: 4 }) // '1d 2h 3m 4s'
 * formatTime({ days: 1, hours: 2, mins: 3, secs: 4 }, true) // '-1d 2h 3m 4s'
 * formatTime({ days: 0, hours: 0, mins: 3, secs: 4 }) // '3m 4s'
 * formatTime({ days: 0, hours: 0, mins: 0, secs: 4 }) // '4s'
 */
export function formatTime(
  { days = 0, hours = 0, mins = 0, secs = 0 }: { days?: number, hours?: number, mins?: number, secs?: number },
  negative = false,
): string {
  // if it's negative and negative is not allowed, return empty string
  if (!negative && (days < 0 || hours < 0 || mins < 0 || secs < 0))
    return ''

  const sign = (negative && (days < 0 || hours < 0 || mins < 0 || secs < 0)) ? '-' : ''

  let timeString = ''
  timeString += days ? `${Math.abs(days)}d ` : ''
  timeString += hours ? `${Math.abs(hours)}h ` : ''
  timeString += mins ? `${Math.abs(mins)}m ` : ''
  timeString += secs ? `${Math.abs(secs)}s` : ''

  return sign + timeString.trim()
}
