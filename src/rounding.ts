import { bigAbs } from './core'

/** User-facing input accepted by most functions. */
export type AnyNumber = bigint | string | number

/**
 * Rounding modes for division, scaling, grid/tick rounding, etc.
 *
 * Directional (always applies):
 * - `DOWN`   → toward -∞
 * - `UP`     → toward +∞
 * - `TRUNC`  → toward 0
 *
 * Halfway (applies only at exact tie `.5` after the rounding place):
 * - `HALF_AWAY_ZERO`    → ties go away from 0 (common “nearest”)
 * - `HALF_TOWARDS_ZERO` → ties go toward 0
 * - `HALF_EVEN`         → ties go to nearest even (banker’s)
 * - `HALF_FLOOR`        → ties toward -∞
 * - `HALF_CEILING`      → ties toward +∞
 *
 * @readonly
 * @enum {string}
 *
 * @example
 * // 5 / 2 with different modes
 * bigDivRound(5n, 2n, ROUND_MODES.TRUNC)           // -> 2n
 * bigDivRound(5n, 2n, ROUND_MODES.HALF_AWAY_ZERO)  // -> 3n
 * bigDivRound(-5n, 2n, ROUND_MODES.HALF_AWAY_ZERO) // -> -3n
 * bigDivRound(5n, 2n, ROUND_MODES.HALF_EVEN)       // -> 2n  (2 is even)
 * bigDivRound(7n, 2n, ROUND_MODES.HALF_EVEN)       // -> 4n  (not a tie; nearest)
 */
export const ROUND_MODES = {
  DOWN: 'down',
  UP: 'up',
  TRUNC: 'trunc',
  HALF_AWAY_ZERO: 'half_away_zero',
  HALF_TOWARDS_ZERO: 'half_towards_zero',
  HALF_EVEN: 'half_even',
  HALF_FLOOR: 'half_floor',
  HALF_CEILING: 'half_ceiling',
} as const

export type Rounding = (typeof ROUND_MODES)[keyof typeof ROUND_MODES]
export type BigRounding = Rounding
export type GridRounding = Rounding

/** BigInt constants (verbosely named to aid readability). */
const BIG_ZERO = BigInt(0)
const BIG_ONE = BigInt(1)
const NEGATIVE_BIG_ONE = BigInt(-1)
const BIG_TWO = BigInt(2)

/**
 * Floor division ⌊a / d⌋ (toward -∞).
 * JS BigInt `/` truncates toward 0; this fixes negatives.
 *
 * @throws RangeError if `d == 0`.
 * @example
 * bigFloorDiv( 7n, 3n) // -> 2n
 * bigFloorDiv(-7n, 3n) // -> -3n
 */
export function bigFloorDiv(a: bigint, d: bigint): bigint {
  if (d === BIG_ZERO) {
    throw new RangeError('bigFloorDiv: division by zero')
  }

  let q = a / d
  const r = a % d // remainder sign matches 'a'

  if (r !== BIG_ZERO && ((r > BIG_ZERO) !== (d > BIG_ZERO))) {
    q -= BIG_ONE
  }

  return q
}

/**
 * Ceiling division ⌈a / d⌉ (toward +∞).
 *
 * @throws RangeError if `d == 0`.
 * @example
 * bigCeilDiv( 7n, 3n) // -> 3n
 * bigCeilDiv(-7n, 3n) // -> -2n
 */
export function bigCeilDiv(a: bigint, d: bigint): bigint {
  if (d === BIG_ZERO) {
    throw new RangeError('bigCeilDiv: division by zero')
  }

  let q = a / d
  const r = a % d

  if (r !== BIG_ZERO && ((r > BIG_ZERO) === (d > BIG_ZERO))) {
    q += BIG_ONE
  }

  return q
}

/**
 * Divide and round per `mode`.
 * Central helper used everywhere rounding is needed.
 *
 * - Directional modes (`DOWN`, `UP`, `TRUNC`) shortcut to floor/ceil/trunc.
 * - Half modes only affect exact ties; otherwise rounds to nearest with sign‑aware tie‑break.
 *
 * @param numerator - Dividend.
 * @param denominator - Divisor (≠ 0).
 * @param mode - Rounding mode.
 * @returns The rounded quotient as BigInt.
 * @throws RangeError if `denominator == 0`.
 *
 * @example
 * bigDivRound(15n, 10n, ROUND_MODES.TRUNC)          // -> 1n
 * bigDivRound(15n, 10n, ROUND_MODES.HALF_AWAY_ZERO) // -> 2n   (1.5 → 2)
 * bigDivRound(-15n, 10n, ROUND_MODES.HALF_EVEN)     // -> -2n  (tie to even)
 */
export function bigDivRound(numerator: bigint, denominator: bigint, mode: Rounding): bigint {
  if (denominator === BIG_ZERO) {
    throw new RangeError('bigDivRound: division by zero')
  }

  if (mode === ROUND_MODES.DOWN) {
    return bigFloorDiv(numerator, denominator)
  }

  if (mode === ROUND_MODES.UP) {
    return bigCeilDiv(numerator, denominator)
  }

  if (mode === ROUND_MODES.TRUNC) {
    return numerator / denominator
  }

  const sgn = (numerator >= BIG_ZERO) === (denominator >= BIG_ZERO) ? BIG_ONE : NEGATIVE_BIG_ONE
  const quotient = numerator / denominator
  const remainder = numerator % denominator
  if (remainder === BIG_ZERO) {
    return quotient
  }

  const ar = bigAbs(remainder)
  const ad = bigAbs(denominator)
  const isHalf = ar * BIG_TWO === ad

  if (isHalf) {
    switch (mode) {
      case ROUND_MODES.HALF_AWAY_ZERO:
        return quotient + sgn
      case ROUND_MODES.HALF_FLOOR:
        return sgn === NEGATIVE_BIG_ONE ? quotient + sgn : quotient
      case ROUND_MODES.HALF_CEILING:
        return sgn === BIG_ONE ? quotient + sgn : quotient
      case ROUND_MODES.HALF_TOWARDS_ZERO:
        return quotient
      case ROUND_MODES.HALF_EVEN:
        return (bigAbs(quotient) & BIG_ONE) === BIG_ZERO ? quotient : quotient + sgn
    }
  }

  return ar * BIG_TWO > ad ? (quotient + sgn) : quotient // Not a tie → nearest
}

/**
 * Round an integer to a multiple of `step`, per `mode`.
 *
 * @param n - Integer to round (can be negative).
 * @param step - Step size (> 0).
 * @param mode - Any rounding mode (directional or half-…).
 * @returns Nearest multiple of `step` according to `mode`.
 * @throws RangeError if `step <= 0`.
 *
 * @example
 * bigRoundIntByStep( 17n, 8n, ROUND_MODES.DOWN)            // -> 16n
 * bigRoundIntByStep( 17n, 8n, ROUND_MODES.HALF_AWAY_ZERO)  // -> 16n  (17/8=2.125 -> 2 * 8)
 * bigRoundIntByStep( 20n, 8n, ROUND_MODES.HALF_AWAY_ZERO)  // -> 24n  (tie at 2.5 -> up)
 * bigRoundIntByStep(-20n, 8n, ROUND_MODES.HALF_EVEN)       // -> -16n (tie to even multiple)
 */
export function bigRoundIntByStep(n: bigint, step: bigint, mode: GridRounding): bigint {
  if (step <= BIG_ZERO) {
    throw new RangeError('bigRoundIntByStep: step must be > 0')
  }

  return bigDivRound(n, step, mode) * step
}
