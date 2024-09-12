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

/**
 * Timestamped id with random string with timestamp
 */
export function getTimestampedID() {
  return (Math.random().toString(36) + Date.now().toString(36)).slice(2)
}

/**
 * formats time object to string with days, hours, minutes and seconds
 *
 * @param  time { days, hours, mins, secs } time object defaults to 0
 * @param negative pass `true` to allow negative results (default: false)
 *
 * @returns formatted time string
 *
 * @example
 * formatTime({ days: 1, hours: 2, mins: 3, secs: 4 }) // '1d 2h 3m 4s'
 * formatTime({ days: 1, hours: 2, mins: 3, secs: 4 }, true) // '-1d 2h 3m 4s'
 * formatTime({ days: 0, hours: 0, mins: 3, secs: 4 }) // '3m 4s'
 * formatTime({ days: 0, hours: 0, mins: 0, secs: 4 }) // '4s'
 */
export function formatTime({ days = 0, hours = 0, mins = 0, secs = 0 }: { days?: number, hours?: number, mins?: number, secs?: number }, negative = false): string {
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
