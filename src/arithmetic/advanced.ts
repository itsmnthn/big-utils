import type { AnyNumber } from './rounding'
import { bigPow10 } from '../core'
import { bigScale } from '../scaling/scale'
import { bigMulDivRound, bigMulDivTrunc } from './fixed-point'
import { ROUND_MODES } from './rounding'

/** BigInt constants (verbosely named to aid readability). */
const BIG_ZERO = BigInt(0)
const BIG_ONE = BigInt(1)

/**
 * Approximate log2(x) for scaled x. Result returned at `scale`.
 * Uses iterative refinement; `iterations` controls accuracy/perf tradeoff.
 *
 * @param xScaled - > 0 at `scale`.
 * @param scale - Decimals for input and output.
 * @param iterations - Iteration count. **Default:** 96.
 * @returns log2(x) at `scale`.
 * @throws RangeError if `xScaled <= 0`.
 *
 * @example
 * // log2(2.0) ≈ 1.0
 * bigLog2Scaled(2_000_000n, 6) // -> ~1_000_000n
 */
export function bigLog2Scaled(xScaled: bigint, scale: number, iterations = 96): bigint {
  if (xScaled <= BIG_ZERO) {
    throw new RangeError('bigLog2Scaled: xScaled must be > 0')
  }

  const base = bigPow10(scale)
  let x = xScaled
  let k = BIG_ZERO
  while (x < base) {
    x <<= BIG_ONE
    k--
  }

  while (x >= (base << BIG_ONE)) {
    x = (x + BIG_ONE) >> BIG_ONE
    k++
  } // divide by 2 (rounded)

  let out = k * base
  let y = x
  for (let i = BIG_ONE; i <= BigInt(iterations); i++) {
    y = bigMulDivTrunc(y, y, base) // y = y^2 / ONE
    if (y >= (base << BIG_ONE)) {
      y = (y + BIG_ONE) >> BIG_ONE
      out += base / (BIG_ONE << i)
    }
  }

  return out
}

/**
 * Compute log_base(x) using change of base.
 * Optionally pass a precomputed `log2(base)` for speed.
 *
 * @param xScaled - x at `scale` (> 0).
 * @param baseScaled - base at `scale` (> 0).
 * @param scale - Decimals.
 * @param iterations - For the internal log2 approximations. **Default:** 96.
 * @param precomputedLog2BaseScaled - Optional log2(base) at `scale`.
 * @returns log_base(x) at `scale`.
 *
 * @example
 * const { baseScaled, log2BaseScaled } = bigPrecomputeBase("1.0001", 8)
 * bigLogBaseScaled(bigScale("1.05", 8), baseScaled, 8, 96, log2BaseScaled) // -> ~ log_{1.0001}(1.05)
 */
export function bigLogBaseScaled(
  xScaled: bigint,
  baseScaled: bigint,
  scale: number,
  iterations = 96,
  precomputedLog2BaseScaled?: bigint,
): bigint {
  const num = bigLog2Scaled(xScaled, scale, iterations)
  const den = precomputedLog2BaseScaled ?? bigLog2Scaled(baseScaled, scale, iterations)

  return bigMulDivRound(num, bigPow10(scale), den, ROUND_MODES.HALF_AWAY_ZERO)
}

/**
 * Precompute base and its log2 at a given scale (handy for repeated log_base calc).
 *
 * @example
 * const p = bigPrecomputeBase("1.0001", 8)
 * // p.baseScaled, p.log2BaseScaled, p.scale
 */
export function bigPrecomputeBase(base: AnyNumber, scale: number, iterations = 96) {
  const baseScaled = bigScale(base, scale)
  const log2BaseScaled = bigLog2Scaled(baseScaled, scale, iterations)

  return { baseScaled, log2BaseScaled, scale }
}
