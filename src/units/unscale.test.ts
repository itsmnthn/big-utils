import { expect, it } from 'vitest'

import { unScale, unScaleToBase } from './unscale'

it('converts value to number', () => {
  expect(unScale(BigInt(69), 0)).toMatchInlineSnapshot('"69"')
  expect(unScale(BigInt(69), 5)).toMatchInlineSnapshot('"0.00069"')
  expect(unScale(BigInt(690), 1)).toMatchInlineSnapshot('"69"')
  expect(unScale(BigInt(1300000), 5)).toMatchInlineSnapshot('"13"')
  expect(unScale(BigInt('4200000000000'), 10)).toMatchInlineSnapshot('"420"')
  expect(unScale(BigInt('20000000000'), 9)).toMatchInlineSnapshot('"20"')
  expect(unScale(BigInt('40000000000000000000'), 18)).toMatchInlineSnapshot('"40"')
  expect(unScale(BigInt('10000000000000'), 18)).toMatchInlineSnapshot('"0.00001"')
  expect(unScale(BigInt(12345), 4)).toMatchInlineSnapshot('"1.2345"')
  expect(unScale(BigInt(12345), 4)).toMatchInlineSnapshot('"1.2345"')
  expect(unScale(BigInt('6942069420123456789123450000'), 18)).toMatchInlineSnapshot(
    '"6942069420.12345678912345"',
  )
  expect(
    unScale(BigInt('694212312312306942012345444446789123450000000000000000000000000000000'), 50),
  ).toMatchInlineSnapshot('"6942123123123069420.1234544444678912345"')
  // negative values
  expect(unScale(BigInt(-690), 1)).toMatchInlineSnapshot('"-69"')
  expect(unScale(BigInt(-1300000), 5)).toMatchInlineSnapshot('"-13"')
  expect(unScale(BigInt('-4200000000000'), 10)).toMatchInlineSnapshot('"-420"')
  expect(unScale(BigInt('-20000000000'), 9)).toMatchInlineSnapshot('"-20"')
  expect(unScale(BigInt('-40000000000000000000'), 18)).toMatchInlineSnapshot('"-40"')
  expect(unScale(BigInt(-12345), 4)).toMatchInlineSnapshot('"-1.2345"')
  expect(unScale(BigInt(-12345), 4)).toMatchInlineSnapshot('"-1.2345"')
  expect(unScale(BigInt('-6942069420123456789123450000'), 18)).toMatchInlineSnapshot(
    '"-6942069420.12345678912345"',
  )
  expect(
    unScale(BigInt('-694212312312306942012345444446789123450000000000000000000000000000000'), 50),
  ).toMatchInlineSnapshot('"-6942123123123069420.1234544444678912345"')
})

it('converts value to base', () => {
  expect(unScaleToBase(BigInt('69000300300000000000'), 18, 6)).toMatchInlineSnapshot('69000300n')
  expect(unScaleToBase(BigInt('-69000300300000000000'), 18, 6)).toMatchInlineSnapshot('-69000300n')
  expect(unScaleToBase(BigInt(69), 0, 0)).toMatchInlineSnapshot('69n')
  expect(unScaleToBase(BigInt(-69), 0, 0)).toMatchInlineSnapshot('-69n')
})
