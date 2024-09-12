import { expect, it } from 'vitest'
import { isMultipleOfMinimum, reduceByRemainder } from './multiple'

it('is given value is multiple of given minimum', () => {
  expect(isMultipleOfMinimum('1000000000000000000', '1000000000000000000')).toMatchInlineSnapshot('true')
  expect(isMultipleOfMinimum('1000000000000000000', '1000000000000000001')).toMatchInlineSnapshot('false')
  expect(isMultipleOfMinimum('1000000000000000001', '1000000000000000000')).toMatchInlineSnapshot('false')
  expect(isMultipleOfMinimum('0', '1000000000000000000')).toMatchInlineSnapshot('false')
  expect(isMultipleOfMinimum('1000000000000000000', '0')).toMatchInlineSnapshot('false')
  expect(isMultipleOfMinimum('0', '0')).toMatchInlineSnapshot('false')
  expect(isMultipleOfMinimum('100', '1')).toMatchInlineSnapshot('true')
  expect(isMultipleOfMinimum('12356', '1')).toMatchInlineSnapshot('true')
  expect(isMultipleOfMinimum('123560', '10')).toMatchInlineSnapshot('true')
  expect(isMultipleOfMinimum('123560', '11')).toMatchInlineSnapshot('false')
  expect(isMultipleOfMinimum('55555555555555555555555555555555555555555555', '11')).toMatchInlineSnapshot('true')
})

it('reduce value till multiple of minimum', () => {
  expect(reduceByRemainder('1000000000000000000', '1000000000000000000')).toMatchInlineSnapshot('1000000000000000000n')
  expect(reduceByRemainder('1000000000000000001', '1000000000000000000')).toMatchInlineSnapshot('1000000000000000000n')
  expect(reduceByRemainder('1000000000000000000', '1000000000000000001')).toMatchInlineSnapshot('0n')
  expect(reduceByRemainder('0', '1000000000000000000')).toMatchInlineSnapshot('0n')
  expect(reduceByRemainder('1000000000000000000', '0')).toMatchInlineSnapshot('0n')
  expect(reduceByRemainder('0', '0')).toMatchInlineSnapshot('0n')
  expect(reduceByRemainder('100', '1')).toMatchInlineSnapshot('100n')
  expect(reduceByRemainder('12356', '1')).toMatchInlineSnapshot('12356n')
  expect(reduceByRemainder('123560', '10')).toMatchInlineSnapshot('123560n')
  expect(reduceByRemainder('123560', '11')).toMatchInlineSnapshot('123552n')
  expect(reduceByRemainder('55555555555555555555555555555555555555555555', '11'))
    .toMatchInlineSnapshot('55555555555555555555555555555555555555555555n')
})
