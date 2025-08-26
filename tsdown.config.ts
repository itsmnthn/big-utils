import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: './src/index.ts',
  outDir: './dist',
  format: ['cjs', 'esm', 'es', 'module'],
  tsconfig: './tsconfig.json',
  clean: true,
  dts: true,
  exports: true,
})
