import type { BigRounding } from '../arithmetic/rounding'
import { bigDivRound, ROUND_MODES } from '../arithmetic/rounding'
import { bigPow10 } from '../core'

/**
 * Change scale of an already scaled value.
 *
 * @param x - Value at `fromScale`.
 * @param fromScale - Current decimals.
 * @param toScale - Target decimals.
 * @param mode - Rounding when reducing precision. **Default:** `TRUNC`.
 * @returns Value at `toScale`.
 *
 * @example
 * bigRescale(1234567n, 6, 8)                          // -> 123456700n
 * bigRescale(1234567n, 6, 2, ROUND_MODES.HALF_EVEN)   // -> 12346n
 */
export function bigRescale(
  x: bigint,
  fromScale: number,
  toScale: number,
  mode: BigRounding = ROUND_MODES.TRUNC,
): bigint {
  if (fromScale === toScale) {
    return x
  }

  if (fromScale < toScale) {
    return x * bigPow10(toScale - fromScale)
  }

  const div = bigPow10(fromScale - toScale)
  return bigDivRound(x, div, mode)
}

/**
 * Align two differently scaled amounts to the same scale.
 *
 * @param a - First value at `aScale`.
 * @param aScale - Decimals of `a`.
 * @param b - Second value at `bScale`.
 * @param bScale - Decimals of `b`.
 * @param mode - Rounding when downscaling. **Default:** `TRUNC`.
 * @param targetScale - Optional target; default is `max(aScale, bScale)`.
 * @returns `{ a, b, scale }` all at `scale`.
 *
 * @example
 * bigAlignScales(100n, 2, 3n, 0) // -> { a: 100n, b: 300n, scale: 2 }
 */
export function bigAlignScales(
  a: bigint,
  aScale: number,
  b: bigint,
  bScale: number,
  mode: BigRounding = ROUND_MODES.TRUNC,
  targetScale?: number,
): { a: bigint, b: bigint, scale: number } {
  const t = targetScale ?? Math.max(aScale, bScale)

  return {
    a: bigRescale(a, aScale, t, mode),
    b: bigRescale(b, bScale, t, mode),
    scale: t,
  }
}
