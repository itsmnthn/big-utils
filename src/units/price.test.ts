import { expect, it } from 'vitest'

import { calcPrice, calcTotalPrice, calcUnits } from './price'

it('calculate unit price from units and total price', () => {
  expect(calcPrice(BigInt(2e6), BigInt(1e5), 6, 6)).toMatchInlineSnapshot('50000n')
  expect(calcPrice(BigInt(100e18), BigInt(1e5), 18, 6)).toMatchInlineSnapshot('1000n')
  expect(calcPrice(BigInt(-123e26), BigInt(1e5), 26, 6)).toMatchInlineSnapshot('813n')
  expect(calcPrice(BigInt(-100e18), BigInt(1e5), 18, 6, true)).toMatchInlineSnapshot('-1000n')
  expect(calcPrice('0', '0', 18, 6, true)).toMatchInlineSnapshot('0n')
})

it('calculate units from unit price and total price', () => {
  expect(calcUnits(BigInt(1e5), BigInt(2e6))).toMatchInlineSnapshot('50000000000000000n')
  expect(calcUnits('723400000', '2124000000', 6, 8)).toMatchInlineSnapshot('34058380n')
  expect(calcUnits(BigInt(723400000e6), BigInt(21240000e6), 36, 18)).toMatchInlineSnapshot('34058380414312617702n')
  expect(calcUnits('100000000', '1000000')).toMatchInlineSnapshot('100000000000000000000n')
  expect(calcUnits('1000', '1200', 2, 2)).toMatchInlineSnapshot('83n')
  expect(calcUnits('0', '0', 2, 2)).toMatchInlineSnapshot('0n')
})

it('calculate total price from units and unit price', () => {
  expect(calcTotalPrice('100', '12', 2, 2)).toMatchInlineSnapshot('12n')
  expect(calcTotalPrice(BigInt(2223e17), '12', 18, 1)).toMatchInlineSnapshot('2667n')
  expect(calcTotalPrice(BigInt(2223e17), '1200000', 18, 6)).toMatchInlineSnapshot('266760000n')
  expect(calcTotalPrice(BigInt(2223e17), '12000000', 18, 6)).toMatchInlineSnapshot('2667600000n')
  expect(calcTotalPrice(BigInt(20e9), BigInt(2e6), 9, 6)).toMatchInlineSnapshot('40000000n')
  expect(calcTotalPrice('20', '2', 0, 0)).toMatchInlineSnapshot('40n')
  expect(calcTotalPrice('-20', '2', 0, 0)).toMatchInlineSnapshot('40n')
  expect(calcTotalPrice('20', '2', 1, 0)).toMatchInlineSnapshot('4n')
  expect(calcTotalPrice('0', '0', 1, 0)).toMatchInlineSnapshot('0n')
})
