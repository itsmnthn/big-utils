import { expect, it } from 'vitest'

import { formatAmount } from './formatter'



it('un-scales the given amount to display value and formatted with preserved decimals', () => {
  expect(formatAmount('10000000', 6)).toMatchObject({ base: BigInt(10000000), display: '10', formatted: '10' })
  expect(formatAmount('1110000', 6, 0)).toMatchObject({ base: BigInt(1110000), display: '1', formatted: '1.11' })
  expect(formatAmount('0', 6, 1)).toMatchObject({ base: BigInt(0), display: '0', formatted: '0' })
  expect(formatAmount('', 6, 1)).toMatchObject({ base: BigInt(0), display: '0', formatted: '0' })
  expect(formatAmount('1110000', 6))
    .toMatchObject({ base: BigInt(1110000), display: '1.11', formatted: '1.11' })
  expect(formatAmount('1110000', 6, 1))
    .toMatchObject({ base: BigInt(1110000), display: '1.1', formatted: '1.11' })
  expect(formatAmount('123456789', 8, 3))
    .toMatchObject({ base: BigInt(123456789), display: '1.234', formatted: '1.23456789' })
  expect(formatAmount('12345678900223', 6, 3))
    .toMatchObject({ base: BigInt(12345678900223), display: '12,345,678.9', formatted: '12345678.900223' })

  // large numbers
  expect(formatAmount('1234567890123456789012345678901234567890', 30, 3))
    .toMatchObject({
      base: BigInt('1234567890123456789012345678901234567890'),
      display: '1,234,567,890.123',
      formatted: '1234567890.12345678901234567890123456789',
    })
  expect(formatAmount('1234567890123456789', 15, 2))
    .toMatchObject({
      base: BigInt('1234567890123456789'),
      display: '1,234.56',
      formatted: '1234.567890123456789',
    })
})
