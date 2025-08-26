// bigint-json.spec.ts
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  bigIntReviver,
  bigIntStringify,
  monkeyPatchBigInt,
  parseWithBigInt,
  stringifyWithBigInt,
  unPatchBigInt,
} from './bigint-json'

// Keep native state to restore after each test (avoid cross-test pollution)
const NATIVE_PARSE = JSON.parse
const HAD_TOJSON = Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')
const ORIGINAL_TOJSON = (BigInt.prototype as any).toJSON

function restoreGlobals() {
  JSON.parse = NATIVE_PARSE
  if (HAD_TOJSON) {
    // eslint-disable-next-line no-extend-native
    Object.defineProperty(BigInt.prototype, 'toJSON', {
      value: ORIGINAL_TOJSON,
      configurable: true,
      writable: true,
    })
  }
  else {
    Reflect.deleteProperty(BigInt.prototype, 'toJSON')
  }
  if ((JSON as any).__bigintPatched) {
    Reflect.deleteProperty(JSON as any, '__bigintPatched')
  }
  if ('window' in globalThis && (globalThis as any).__testInjectedWindow) {
    delete (globalThis as any).window
    delete (globalThis as any).__testInjectedWindow
  }
}

beforeEach(restoreGlobals)
afterEach(restoreGlobals)

function withBrowserWindow() {
  if (typeof (globalThis as any).window === 'undefined') {
    ;(globalThis as any).window = {}
    ;(globalThis as any).__testInjectedWindow = true
  }
}

// --------------------------- bigIntReviver ---------------------------
describe('bigIntReviver', () => {
  it('revives positive and negative BigInt strings ending with "n"', () => {
    expect(bigIntReviver('', '123n')).toBe(123n)
    expect(bigIntReviver('', '-987654321n')).toBe(-987654321n)
  })

  it('does not revive non-matching strings', () => {
    expect(bigIntReviver('', '123')).toBe('123')
    expect(bigIntReviver('', '12n3')).toBe('12n3')
    expect(bigIntReviver('', '12N')).toBe('12N')
    expect(bigIntReviver('', 'n')).toBe('n')
  })

  it('accepts leading zeros per regex (e.g., "001n" → 1n)', () => {
    expect(bigIntReviver('', '001n')).toBe(1n)
  })

  it('works as a JSON.parse reviver for nested structures', () => {
    const json = JSON.stringify({ a: '1n', b: ['-2n', '3', { c: '4n' }] })
    const out = JSON.parse(json, bigIntReviver) as any
    expect(out.a).toBe(1n)
    expect(out.b[0]).toBe(-2n)
    expect(out.b[1]).toBe('3')
    expect(out.b[2].c).toBe(4n)
  })
})

// -------------------------- bigIntStringify --------------------------
describe('bigIntStringify', () => {
  it('stringifies BigInt properties to "<digits>n"', () => {
    const s = JSON.stringify({ a: 123n, b: -5n, c: 'x' }, bigIntStringify)
    expect(s).toBe('{"a":"123n","b":"-5n","c":"x"}')
  })

  it('leaves non-BigInt values unchanged', () => {
    const s = JSON.stringify({ a: 1, b: '2', c: true, d: null }, bigIntStringify)
    expect(s).toBe('{"a":1,"b":"2","c":true,"d":null}')
  })

  it('handles top-level BigInt with replacer', () => {
    expect(JSON.stringify(123n as any, bigIntStringify)).toBe('"123n"')
  })
})

// -------------------------- parseWithBigInt --------------------------
describe('parseWithBigInt', () => {
  it('parses and revives without touching global JSON.parse', () => {
    const before = JSON.parse
    const json = '{"a":"123n","b":"-1n","c":"nope"}'
    const out = parseWithBigInt(json) as any
    expect(JSON.parse).toBe(before) // not patched globally
    expect(out.a).toBe(123n)
    expect(out.b).toBe(-1n)
    expect(out.c).toBe('nope')
  })
})

// ------------------------ stringifyWithBigInt ------------------------
describe('stringifyWithBigInt', () => {
  it('serializes BigInt fields via replacer', () => {
    const s = stringifyWithBigInt({ x: 1n, y: '2' })
    expect(s).toBe('{"x":"1n","y":"2"}')
  })

  it('handles top-level BigInt correctly', () => {
    expect(stringifyWithBigInt(7n as any)).toBe('"7n"')
  })
})

// ------------------------- monkeyPatchBigInt -------------------------
describe('monkeyPatchBigInt — patching behavior', () => {
  it('idempotent: repeated calls do not wrap multiple times', () => {
    const before = JSON.parse
    const un = monkeyPatchBigInt() // no onlyBrowser gate
    const first = JSON.parse
    const un2 = monkeyPatchBigInt()
    const second = JSON.parse
    expect(first).not.toBe(before)
    expect(second).toBe(first)
    expect((JSON as any).__bigintPatched).toBe(true)
    un()
    un2() // both should be safe
  })

  it('adds BigInt.prototype.toJSON and makes JSON.parse revive', () => {
    const un = monkeyPatchBigInt()
    expect(typeof (BigInt.prototype as any).toJSON).toBe('function')
    const json = JSON.stringify({ a: 999n, b: -3n })
    expect(json).toBe('{"a":"999n","b":"-3n"}')
    const parsed = JSON.parse(json) as any
    expect(parsed.a).toBe(999n)
    expect(parsed.b).toBe(-3n)
    un()
  })

  it('chains user reviver AFTER BigInt revival', () => {
    const un = monkeyPatchBigInt()
    const json = JSON.stringify({ v: 10n })
    const parsed = JSON.parse(json, (_k, v) => (typeof v === 'bigint' ? v + 1n : v)) as any
    expect(parsed.v).toBe(11n)
    un()
  })

  it('onlyBrowser=true: does not patch when window is undefined', () => {
    expect(typeof (globalThis as any).window).toBe('undefined')
    const before = JSON.parse
    const un = monkeyPatchBigInt(true)
    expect(JSON.parse).toBe(before)
    expect((JSON as any).__bigintPatched).toBeUndefined()
    un() // no-op
  })

  it('onlyBrowser=true: patches when window exists', () => {
    withBrowserWindow()
    const before = JSON.parse
    const un = monkeyPatchBigInt(true)
    expect(JSON.parse).not.toBe(before)
    expect((JSON as any).__bigintPatched).toBe(true)
    // roundtrip
    const s = JSON.stringify({ a: 1n })
    expect(JSON.parse(s)).toEqual({ a: 1n })
    un()
  })
})

// --------------------------- unPatchBigInt ---------------------------
describe('unPatchBigInt — restoring globals', () => {
  it('restores JSON.parse and removes toJSON/flag', () => {
    const before = JSON.parse
    const hadToJSON = Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')

    const un = monkeyPatchBigInt()
    expect((JSON as any).__bigintPatched).toBe(true)
    expect(JSON.parse).not.toBe(before)
    expect(Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')).toBe(true)

    un()
    expect(JSON.parse).toBe(NATIVE_PARSE)
    expect((JSON as any).__bigintPatched).toBeUndefined()
    // If the test runner started without toJSON, it should be removed by unpatch.
    expect(Object.prototype.hasOwnProperty.call(BigInt.prototype, 'toJSON')).toBe(hadToJSON)
  })

  it('returned unPatch function works and is safe to call multiple times', () => {
    const before = JSON.parse
    const un = monkeyPatchBigInt()
    expect(JSON.parse).not.toBe(before)
    un()
    expect(JSON.parse).toBe(NATIVE_PARSE)
    // double un-patch is safe
    unPatchBigInt()
    unPatchBigInt()
    expect(JSON.parse).toBe(NATIVE_PARSE)
  })
})
