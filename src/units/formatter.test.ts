import { expect, it } from 'vitest'

import { formatAmount, formatWithComma, getSmallest, shortenDecimals, stripTrailingZeros } from './formatter'

it('get the smallest number if the given number is smaller than required', () => {
  expect(getSmallest('100', 2)).toEqual('100')
  expect(getSmallest('0.009', 2)).toEqual('< 0.01')

  expect(getSmallest('-100', 2)).toEqual('-100')
  expect(getSmallest('-0.007', 2)).toEqual('< -0.09')
})

it('shortenDecimals', () => {
  expect(shortenDecimals('100', 2)).toEqual('100')
  expect(shortenDecimals('-100', 2)).toEqual('-100')

  expect(shortenDecimals('0.009', 2)).toEqual('0')
  expect(shortenDecimals('-0.0002', 2)).toEqual('0')
  expect(shortenDecimals('0.009', 2, true)).toEqual('< 0.01')
  expect(shortenDecimals('-0.007', 2, true)).toEqual('< -0.09')

  expect(shortenDecimals('100.000000', 2)).toEqual('100')
  expect(shortenDecimals('100.000000100', 7)).toEqual('100.0000001')
  expect(shortenDecimals('-10.007', 2)).toEqual('-10')
  expect(shortenDecimals('-10.007', 0, true)).toEqual('-10')
  expect(shortenDecimals('12.992', 0, true)).toEqual('12')
  expect(shortenDecimals('67.992', 1, true)).toEqual('67.9')
})

it('removes tailing zero in fraction', () => {
  expect(stripTrailingZeros('299.')).toMatchInlineSnapshot('"299"')
  expect(stripTrailingZeros('1.69000')).toMatchInlineSnapshot('"1.69"')
  expect(stripTrailingZeros('1000.3')).toMatchInlineSnapshot('"1000.3"')
  expect(stripTrailingZeros(-100.324000)).toMatchInlineSnapshot('"-100.324"')

  expect(stripTrailingZeros(100)).toMatchInlineSnapshot('"100"')
  expect(stripTrailingZeros(-100)).toMatchInlineSnapshot('"-100"')
})

it('adds comma to a number or amount string', () => {
  expect(formatWithComma(BigInt(10000))).toMatchInlineSnapshot('"10,000"')

  expect(formatWithComma(10000)).toMatchInlineSnapshot('"10,000"')
  expect(formatWithComma(0)).toMatchInlineSnapshot('"0"')

  expect(formatWithComma(-10000)).toMatchInlineSnapshot('"-10,000"')
  expect(formatWithComma(-0)).toMatchInlineSnapshot('"0"')
  expect(formatWithComma(-10000.235)).toMatchInlineSnapshot('"-10,000.235"')
  expect(formatWithComma(-235)).toMatchInlineSnapshot('"-235"')

  expect(formatWithComma('235')).toMatchInlineSnapshot('"235"')
  expect(formatWithComma('235')).toMatchInlineSnapshot('"235"')
  expect(formatWithComma('0.235')).toMatchInlineSnapshot('"0.235"')
  expect(formatWithComma('.23512142')).toMatchInlineSnapshot('".23512142"')
  expect(formatWithComma('< 0.009')).toMatchInlineSnapshot('"< 0.009"')
  expect(formatWithComma('> 0.001')).toMatchInlineSnapshot('"> 0.001"')
  expect(formatWithComma('> -0.001')).toMatchInlineSnapshot('"> -0.001"')
})

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
