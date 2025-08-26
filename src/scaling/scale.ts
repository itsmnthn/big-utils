import type { AnyNumber, BigRounding } from '../arithmetic/rounding'
import { bigDivRound, ROUND_MODES } from '../arithmetic/rounding'
import { bigAbs, bigPow10 } from '../core/index'
import { BIG_ZERO } from '../utils/zro'

/**
 * Parse a decimal and scale it to integer form.
 * Accepts strings like `"1.23"`, `"1e-3"`, numbers, or bigint.
 *
 * @param x - Value to scale.
 * @param scale - Target decimals.
 * @param mode - Rounding when input has more precision than `scale`. **Default:** `HALF_AWAY_ZERO`.
 * @returns The scaled BigInt (x * 10^scale, rounded).
 *
 * @example
 * bigScale("1.234", 2)                                 // -> 123n  (1.23; ties away by default)
 * bigScale("1.235", 2, ROUND_MODES.HALF_EVEN)          // -> 124n  (tie to even)
 * bigScale(5n, 6)                                      // -> 5_000_000n
 */
export function bigScale(x: AnyNumber, scale: number, mode: BigRounding = ROUND_MODES.HALF_AWAY_ZERO): bigint {
  if (typeof x === 'bigint') {
    return x * bigPow10(scale)
  }

  const s = String(x).trim()
  const m = /^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i.exec(s)
  if (!m) {
    throw new TypeError(`bigScale: invalid input: ${s}`)
  }

  const hasDigits = (m[2]?.length ?? 0) + (m[3]?.length ?? 0) > 0
  if (!hasDigits) {
    throw new TypeError(`bigScale: invalid input: ${s}`)
  }

  const sign = m[1] === '-' ? '-' : ''
  const intPart = m[2] || '0'
  const fracPart = m[3] || ''
  const exp = m[4] ? BigInt(m[4]) : BIG_ZERO
  const num = BigInt(sign + intPart + fracPart)
  if (bigAbs(num) === BIG_ZERO) {
    return BIG_ZERO
  }

  const fracLen = BigInt(fracPart.length)
  const k = exp - fracLen + BigInt(scale)

  if (k >= BIG_ZERO) {
    return num * bigPow10(k)
  }
  // else
  const div = bigPow10(-k)
  return bigDivRound(num, div, mode)
}

/**
 * Format a scaled BigInt as a decimal string.
 *
 * @param x - Scaled value.
 * @param scale - Input scale of `x`.
 * @param outDecimals - Number of decimals to print (0 → integer string).
 * @param mode - Rounding applied when reducing displayed decimals. **Default:** `TRUNC`.
 * @returns Decimal string.
 *
 * @example
 * bigUnscale(1234567n, 6, 2)                                 // -> "1.23"
 * bigUnscale(1250n,     3, 2, ROUND_MODES.HALF_AWAY_ZERO)     // -> "1.25"
 * bigUnscale(-1250n,    3, 2, ROUND_MODES.HALF_TOWARDS_ZERO)  // -> "-1.24"
 */
export function bigUnscale(
  x: bigint,
  scale: number,
  outDecimals: number,
  mode: BigRounding = ROUND_MODES.TRUNC,
): string {
  const d = Math.max(0, outDecimals | 0)
  const factor = bigPow10(scale)
  const outFactor = bigPow10(d)
  const neg = x < BIG_ZERO
  const u = neg ? -x : x

  const scaled = bigDivRound(u * outFactor, factor, mode)
  const intStr = (scaled / outFactor).toString()
  const frac = (scaled % outFactor).toString().padStart(d, '0')
  const s = d ? `${intStr}.${frac}` : intStr

  return neg ? `-${s}` : s
}
