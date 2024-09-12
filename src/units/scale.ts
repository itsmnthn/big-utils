let isAlwaysRoundDown = false

/**
 * Set the default rounding behavior for the scale function. If true, the scale function will always round down.
 * If false, the scale function will round off.
 * @warn use with caution, as this will affect all calls to the scale function. use if you want your entire application to always round down.
 */
export function setAlwaysRoundDown(value: boolean) {
  isAlwaysRoundDown = value
}

/**
 * Multiplies a string representation of a number by a given exponent of base 10 (10exponent).
 * @returns A BigInt number
 * @example
 * scale('112', 18) // 112000000000000000000n
 * scale(112, 18) // 112000000000000000000n
 * scale(112.5632, 0) // 113n
 * scale(112.5632, 0, true) // 112n
 */
export function scale(value: string | number | bigint, decimals: number, roundDown = isAlwaysRoundDown) {
  let [integer, fraction = '0'] = value.toString().split('.')

  const negative = integer.startsWith('-')
  if (negative)
    integer = integer.slice(1)

  // trim leading zeros.
  fraction = fraction.replace(/(0+)$/, '')

  // round off if the fraction is larger than the number of decimals.
  if (decimals === 0) {
    if (Math.round(Number(`.${fraction}`)) === 1 && !roundDown)
      integer = `${BigInt(integer) + BigInt(1)}`
    fraction = ''
  }
  else if (fraction.length > decimals && !roundDown) {
    const left = fraction.slice(0, decimals - 1)
    const unit = fraction.slice(decimals - 1, decimals)
    const right = fraction.slice(decimals)

    const rounded = Math.round(Number(`${unit}.${right}`))
    if (rounded > 9)
      fraction = `${BigInt(left) + BigInt(1)}0`.padStart(left.length + 1, '0')
    else fraction = `${left}${rounded}`

    if (fraction.length > decimals) {
      fraction = fraction.slice(1)
      integer = `${BigInt(integer) + BigInt(1)}`
    }

    fraction = fraction.slice(0, decimals)
  }
  else if (fraction.length > decimals && roundDown) {
    fraction = fraction.slice(0, decimals)
  }
  else {
    fraction = fraction.padEnd(decimals, '0')
  }

  return BigInt(`${negative ? '-' : ''}${integer}${fraction}`)
}
