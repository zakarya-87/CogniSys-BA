// lint-staged config
// Run the full test suite on any staged TS/TSX change.
// We don't use `tsc --noEmit` here because the project has pre-existing
// TypeScript errors (ConceptModeler D3 generics, ErrorBoundary class typing)
// that make tsc unusable as a commit gate until those are resolved.
module.exports = {
  '*.{ts,tsx}': () => 'npm run test',
};
