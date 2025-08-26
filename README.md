# BigInt Utils for DApps

Utils for BigInt manipulation and formatting for DeFi/Blockchain applications(DAPPS).

**ESM:** 50.77 kB &nbsp;│&nbsp; **gzip**: 13.81 kB 
<br>
**CJS:** 52.37 kB &nbsp;│&nbsp; **gzip**: 14.07 kB

## Installation

```bash
pnpm add @itsmnthn/big-utils@latest
yarn add @itsmnthn/big-utils@latest
npm install @itsmnthn/big-utils@latest
bun add @itsmnthn/big-utils@latest
```

## Quick Start

```typescript
import {
  // Core math functions
  bigAbs, bigPow10, bigGcd,

  // Advanced arithmetic
  bigMulDivTrunc, bigSqrtScaled, bigLog2Scaled,

  // Scaling & formatting
  bigScale, bigUnscale, formatWithComma,

  // DeFi utilities
  calcTotalPrice, calcUnitPrice, formatAmount
} from '@itsmnthn/big-utils'

// Calculate token price with 18 decimals
const price = calcTotalPrice(1000000000000000000n, 1500000000n, 18, 9)
// Result: 1500000000000000000n (1.5 USD with 9 decimals)

// Format for display
const displayPrice = formatAmount(price, 9, 2)
// { base: 1500000000000000000n, display: '1.50', formatted: '1.5' }
```

## Key Features

- ✅ **Zero Dependencies** - Pure BigInt operations
- ✅ **Tree-Shakeable** - Import only what you need
- ✅ **TypeScript First** - Full type safety
- ✅ **High Performance** - Optimized BigInt operations
- ✅ **DeFi Ready** - Token price calculations, formatting
- ✅ **Modular Design** - Clean, maintainable architecture

## Migration from v1.x

`coming soon`

> There are breaking changes in v2.0.0. some function renamed & some parameters changed.

## Documentation

[📚 v1 API Documentation](https://big-utils.pages.dev/)

---

Made with ❤️ for the DeFi ecosystem
