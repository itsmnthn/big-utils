import { describe, expect, it } from 'vitest'
import { formatTime, getTimestampedID, range, shortenString } from '../src'

describe('shortenString', () => {
  it('shorten string by 4 character from both side and concat with ...', () => {
    expect(shortenString('this should work like this')).toEqual('this...this')
  })
  it('shorten string with custom characters', () => {
    expect(shortenString('this should work like this', 4, 6)).toEqual('this...e this')
  })
  it('shorten string with custom characters and concat with custom ellipse', () => {
    expect(shortenString('this should work like this', 4, 4, '---')).toEqual('this---this')
  })
})

describe('getTimestampedID', () => {
  it('random string from timestamp', () => {
    expect(getTimestampedID()).toBeTypeOf('string')
  })
})

describe('formatTime', () => {
  it('convert time in words', () => {
    expect(formatTime({ days: 1, hours: 3, mins: 5, secs: 2 })).toEqual('1d 3h 5m 2s')
    expect(formatTime({ days: 2, hours: 0, mins: 0, secs: 0 })).toEqual('2d')
    expect(formatTime({ days: 0, hours: 1, mins: 0, secs: 0 })).toEqual('1h')
    expect(formatTime({ days: 0, hours: 0, mins: 3, secs: 0 })).toEqual('3m')
    expect(formatTime({ days: 0, hours: 0, mins: 0, secs: 2 })).toEqual('2s')
    expect(formatTime({ days: 0, hours: 1, mins: 0, secs: 59 })).toEqual('1h 59s')
    expect(formatTime({ days: 0, hours: 1, mins: 10, secs: 0 })).toEqual('1h 10m')
    expect(formatTime({ days: 0, hours: 0, mins: 0, secs: 0 })).toEqual('')
    expect(formatTime({ days: 0, hours: -1, mins: -12, secs: 0 })).toEqual('')
    expect(formatTime({ days: 0, hours: -1, mins: -12, secs: 0 }, true)).toEqual('-1h 12m')
  })
})

describe('range', () => {
  it('generates range from n to n', () => {
    expect(range(1, 5)).toEqual([1, 2, 3, 4, 5])
    expect(range(10, 15)).toEqual([10, 11, 12, 13, 14, 15])
    expect(range(100, 106, 2)).toEqual([100, 102, 104, 106])
    expect(range(100, 109, 2)).toEqual([100, 102, 104, 106, 108])
  })
})
