import { expect, it } from 'vitest'

import { absBig, getBigSign } from './bigUtils'

it('convert number to positive', () => {
  expect(absBig('-123')).toMatchInlineSnapshot('123n')
  expect(absBig('123')).toMatchInlineSnapshot('123n')
  expect(absBig('0')).toMatchInlineSnapshot('0n')
})

it('get sign of given number', () => {
  expect(getBigSign('0')).toBe(0)
  expect(getBigSign(BigInt(0))).toBe(0)
  expect(getBigSign('123')).toBe(1)
  expect(getBigSign('-123')).toBe(-1)
  expect(getBigSign(BigInt('694212312312306942012345444446789123450000000000000000000000000000000'))).toBe(1)
  expect(getBigSign('-694212312312306942012345444446789123450000000000000000000000000000000')).toBe(-1)
})
