import { expect, it } from 'vitest'
import { formatSmallest, formatWithComma, shortenDecimals, trimTrailingZeros } from './formatter'

it('get the smallest number if the given number is smaller than required', () => {
  expect(formatSmallest('100', 2)).toEqual('100')
  expect(formatSmallest('0.009', 2)).toEqual('< 0.01')

  expect(formatSmallest('-100', 2)).toEqual('-100')
  expect(formatSmallest('-0.007', 2)).toEqual('> -0.01')

  expect(formatSmallest('-0.009', 2)).toEqual('> -0.01') // still closer to 0 than -0.01
  expect(formatSmallest('-0.0101', 2)).toEqual('-0.0101') // magnitude ≥ 0.01 → show raw string
  expect(formatSmallest('0.007', 2)).toEqual('< 0.01') // positive side symmetry
  expect(formatSmallest('0', 2)).toEqual('0')
})

it('shortenDecimals', () => {
  expect(shortenDecimals('100', 2)).toEqual('100')
  expect(shortenDecimals('-100', 2)).toEqual('-100')

  expect(shortenDecimals('0.009', 2)).toEqual('0')
  expect(shortenDecimals('-0.0002', 2)).toEqual('0')
  expect(shortenDecimals('0.009', 2, true)).toEqual('< 0.01')
  expect(shortenDecimals('-0.007', 2, true)).toEqual('> -0.01')

  expect(shortenDecimals('100.000000', 2)).toEqual('100')
  expect(shortenDecimals('100.000000100', 7)).toEqual('100.0000001')
  expect(shortenDecimals('-10.007', 2)).toEqual('-10')
  expect(shortenDecimals('-10.007', 0, true)).toEqual('-10')
  expect(shortenDecimals('12.992', 0, true)).toEqual('12')
  expect(shortenDecimals('67.992', 1, true)).toEqual('67.9')
})

it('removes tailing zero in fraction', () => {
  expect(trimTrailingZeros('299.')).toMatchInlineSnapshot('"299"')
  expect(trimTrailingZeros('1.69000')).toMatchInlineSnapshot('"1.69"')
  expect(trimTrailingZeros('1000.3')).toMatchInlineSnapshot('"1000.3"')
  expect(trimTrailingZeros(-100.324000)).toMatchInlineSnapshot('"-100.324"')

  expect(trimTrailingZeros(100)).toMatchInlineSnapshot('"100"')
  expect(trimTrailingZeros(-100)).toMatchInlineSnapshot('"-100"')
})

it('adds comma to a number or amount string', () => {
  expect(formatWithComma(BigInt(10000))).toMatchInlineSnapshot('"10,000"')

  expect(formatWithComma(10000)).toMatchInlineSnapshot('"10,000"')
  expect(formatWithComma(0)).toMatchInlineSnapshot('"0"')

  expect(formatWithComma(-10000)).toMatchInlineSnapshot('"-10,000"')
  expect(formatWithComma(-0)).toMatchInlineSnapshot('"-0"')
  expect(formatWithComma(-10000.235)).toMatchInlineSnapshot('"-10,000.235"')
  expect(formatWithComma(-235)).toMatchInlineSnapshot('"-235"')

  expect(formatWithComma('235')).toMatchInlineSnapshot('"235"')
  expect(formatWithComma('235')).toMatchInlineSnapshot('"235"')
  expect(formatWithComma('0.235')).toMatchInlineSnapshot('"0.235"')
  expect(formatWithComma('.23512142')).toMatchInlineSnapshot('"0.23512142"')
  expect(formatWithComma('< 0.009')).toMatchInlineSnapshot('"< 0.009"')
  expect(formatWithComma('> 0.001')).toMatchInlineSnapshot('"> 0.001"')
  expect(formatWithComma('> -0.001')).toMatchInlineSnapshot('"> -0.001"')
})
