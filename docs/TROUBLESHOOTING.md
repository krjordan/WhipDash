# Troubleshooting Guide

## Common CI/CD Issues and Solutions

### 1. npm Error: "could not determine executable to run"

**Symptoms:**

- Build completes successfully but npm throws an error
- Exit code 1 in GitHub Actions
- Error appears at the end of successful builds

**Causes:**

- Trailing commands or scripts trying to run
- Environment differences between local and CI
- npm caching issues
- Missing dependencies for analyze commands

**Solutions:**

1. Use `npm run build:ci` instead of `npm run build` in CI
2. For bundle analysis: ensure `webpack-bundle-analyzer` is installed
3. Clear npm cache: `npm cache clean --force`
4. Ensure all scripts have explicit exit conditions
5. Check for postinstall or postbuild hooks

**Fixed in our setup:**

- All workflows now use `npm run build:ci`
- Bundle analysis properly configured with webpack-bundle-analyzer
- Robust error handling in all CI workflows

### 2. Turbopack Webpack Warning

**Symptoms:**

- Warning: "Webpack is configured while Turbopack is not, which may cause problems"
- Appears when using `--turbopack` flag in development

**Cause:**

- Next.js config defines webpack configuration that conflicts with Turbopack
- Turbopack uses its own bundler, not webpack

**Solution:**

- Configure webpack only when needed (bundle analysis)
- Use conditional webpack configuration based on `ANALYZE` environment variable
- This allows Turbopack in development, webpack in production builds

**Fixed in our setup:**

```typescript
// Only add webpack config when bundle analysis is enabled
if (process.env.ANALYZE === 'true') {
	nextConfig.webpack = (config, { isServer, dev }) => {
		// Bundle analyzer configuration
	}
}
```

### 3. Bundle Analysis Failures

**Common Issues:**

- "could not determine executable to run" after build
- Missing bundle analyzer dependencies
- Configuration errors with Next.js

**Solutions:**

1. **Dependencies:**

   ```bash
   npm install --save-dev webpack-bundle-analyzer
   ```

2. **Next.js Configuration:**

   - Configure webpack in `next.config.ts`
   - Use `ANALYZE=true` environment variable
   - Set proper output paths for reports

3. **CI Workflow:**

   - Install analyzer as separate step
   - Use `npm run analyze` instead of direct build
   - Handle missing analysis files gracefully

### 4. Lighthouse CI Failures

**Common Issues:**

- Accessibility score below threshold
- Server startup timeouts
- Artifact upload failures

**Solutions:**

1. **Accessibility Issues:**

   - Add `aria-labels` to interactive elements
   - Ensure proper heading hierarchy
   - Add skip links for keyboard navigation
   - Use semantic HTML elements

2. **Server Startup:**

   - Use robust health checks with curl
   - Increase timeout values
   - Properly manage background processes

3. **Artifact Upload:**
   - Set `uploadArtifacts: false` for simple runs
   - Use unique artifact names
   - Check GitHub Actions storage limits

### 5. Build Cache Issues

**Warning:** "No build cache found"

**Solutions:**

- This is normal for first runs or fresh CI environments
- Cache will be created automatically for subsequent runs
- Can be safely ignored if build completes successfully

### 6. Test Failures in CI

**Common Causes:**

- Environment differences (JSDOM vs browser)
- Timing issues with async operations
- Missing browser APIs

**Solutions:**

- Use Jest setup files for mocking
- Add proper `await` and `findBy*` for async operations
- Mock browser APIs in `jest.setup.js`

### 7. TypeScript Errors in CI

**Issue:** "Cannot find module" for test utilities

**Solution:**

- Ensure proper `@types` packages are installed
- Add type declarations in `src/types/`
- Import testing library types in test files

## Debugging Steps

1. **Check Logs:**

   - Review complete GitHub Actions logs
   - Look for specific error messages
   - Check for warnings that might indicate issues

2. **Local Testing:**

   ```bash
   npm run ci  # Run full CI pipeline locally
   npm run build:ci  # Test robust build command
   npm run test:ci  # Run tests in CI mode
   npm run analyze  # Test bundle analysis
   npm run dev  # Test development server (should have no warnings)
   ```

3. **Environment Matching:**

   - Use same Node.js version as CI
   - Clear local caches: `rm -rf node_modules .next && npm ci`
   - Test with fresh git clone

4. **Incremental Debugging:**
   - Comment out sections of CI workflow
   - Add debug output with `echo` commands
   - Use `continue-on-error: true` for non-critical steps

## Getting Help

If issues persist:

1. Check GitHub Actions logs for detailed error messages
2. Review recent changes that might have introduced issues
3. Test locally with exact CI environment setup
4. Check for known issues in dependencies

## Quick Fixes

```bash
# Clear all caches and reinstall
rm -rf node_modules .next .eslintcache
npm ci

# Test full CI pipeline locally
npm run ci

# Test bundle analysis
npm run analyze

# Test development server (should have no warnings)
npm run dev

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update
```

## CI/CD Commands Reference

```bash
# Robust build commands (use in CI)
npm run build:ci    # Build with success confirmation
npm run test:ci     # Tests with coverage, no watch
npm run analyze     # Bundle analysis with webpack-bundle-analyzer

# Standard commands (for local development)
npm run build       # Standard Next.js build
npm run test        # Jest tests
npm run dev         # Development server with Turbopack (no warnings)
```

## Development vs Production

- **Development:** Uses Turbopack (`--turbopack` flag) for faster builds
- **Production/CI:** Uses webpack for builds and bundle analysis
- **Bundle Analysis:** Only available in production builds (not compatible with Turbopack)
