import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  ignores: ['dist', 'node_modules', 'dist-ssr', 'docs', '*.local', '*.spec.ts'],
})
