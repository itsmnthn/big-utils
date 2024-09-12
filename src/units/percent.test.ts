import { expect, it } from 'vitest'
import { calcPercentage, calcPercentValue, decreaseByPercentage, increaseByPercentage } from './percent'

it('calc percent of the given value', () => {
  expect(calcPercentValue('100', 10, 2)).toMatchInlineSnapshot('10n')
  expect(calcPercentValue('100', 25, 2)).toMatchInlineSnapshot('25n')
  expect(calcPercentValue(BigInt(125e9), 50, 9)).toMatchInlineSnapshot('62500000000n')
  expect(calcPercentValue('1234567898765432123456789', 50, 18)).toMatchInlineSnapshot('617283949382716061728394n')
  expect(calcPercentValue('1248933', 25.5, 6)).toMatchInlineSnapshot('318477n')
  expect(calcPercentValue('1248933', 45.324624, 6)).toMatchInlineSnapshot('566074n')
  expect(calcPercentValue(1000000, 60, 6)).toMatchInlineSnapshot('600000n')
  expect(calcPercentValue(BigInt(100e18), 50, 18)).toMatchInlineSnapshot('50000000000000000000n')
  expect(calcPercentValue(1e6, 0, 6)).toMatchInlineSnapshot('0n')
  expect(calcPercentValue(50, 150, 0)).toMatchInlineSnapshot('75n')
  expect(calcPercentValue(50, 1500000000000000, 0)).toMatchInlineSnapshot('750000000000000n')
  expect(calcPercentValue(0, 0, 0)).toMatchInlineSnapshot('0n')
  expect(calcPercentValue(0, 100, 0)).toMatchInlineSnapshot('0n')
})

it('calc percentage of the second value from the main value', () => {
  expect(calcPercentage('100', '10', 2)).toMatchInlineSnapshot('10')
  expect(calcPercentage('100', '25', 2)).toMatchInlineSnapshot('25')
  expect(calcPercentage(BigInt(125e9), '62500000000', 9)).toMatchInlineSnapshot('50')
  expect(calcPercentage('1234567898765432123456789', '617283949382716061728394', 18)).toMatchInlineSnapshot('50') // 49.9999999999999999999999594999999190000006
  expect(calcPercentage('1248933', '318477', 6)).toMatchInlineSnapshot('25.5')
  expect(calcPercentage('1248933', 566074, 6)).toMatchInlineSnapshot('45.325') // 45.3246090863160794
  expect(calcPercentage('1248933', 566074, 6, 5)).toMatchInlineSnapshot('45.32461') // 45.3246090863160794
  expect(calcPercentage(1000000, 600000, 6)).toMatchInlineSnapshot('60')
  expect(calcPercentage(BigInt(100e18), '50000000000000000000', 18)).toMatchInlineSnapshot('50')
  expect(calcPercentage(10000000000, 10000000, 10)).toMatchInlineSnapshot('0.1')
  expect(calcPercentage(50, 75, 0)).toMatchInlineSnapshot('150')
  expect(calcPercentage(50, 750, 0)).toMatchInlineSnapshot('1500')
  expect(calcPercentage(1e6, 0, 6)).toMatchInlineSnapshot('0')
  expect(calcPercentage(0, 0, 6)).toMatchInlineSnapshot('0')
  expect(calcPercentage(0, 100, 6)).toMatchInlineSnapshot('0')
})

it('increase a number by given percentage', () => {
  expect(increaseByPercentage('100', 10, 2)).toMatchInlineSnapshot('110n')
  expect(increaseByPercentage('100', 25, 2)).toMatchInlineSnapshot('125n')
  expect(increaseByPercentage('100', 0, 2)).toMatchInlineSnapshot('100n')
  expect(increaseByPercentage('100', 0, 2)).toMatchInlineSnapshot('100n')
  expect(increaseByPercentage(-100, 50, 9)).toMatchInlineSnapshot('-50n')
  expect(increaseByPercentage(0, 50, 9)).toMatchInlineSnapshot('0n')
  expect(increaseByPercentage(0, 0, 9)).toMatchInlineSnapshot('0n')
  expect(increaseByPercentage(-0, 0, 9)).toMatchInlineSnapshot('0n')
})

it('decease a number by given percentage', () => {
  expect(decreaseByPercentage('100', 10, 2)).toMatchInlineSnapshot('90n')
  expect(decreaseByPercentage('100', 25, 2)).toMatchInlineSnapshot('75n')
  expect(decreaseByPercentage('100', 0, 2)).toMatchInlineSnapshot('100n')
  expect(decreaseByPercentage(-100, 50, 9)).toMatchInlineSnapshot('-150n')
  expect(decreaseByPercentage(0, 50, 9)).toMatchInlineSnapshot('0n')
  expect(decreaseByPercentage(0, 0, 9)).toMatchInlineSnapshot('0n')
  expect(decreaseByPercentage(-0, 0, 9)).toMatchInlineSnapshot('0n')
})
