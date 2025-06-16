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

**Solutions:**

1. Use `npm run build:ci` instead of `npm run build` in CI
2. Clear npm cache: `npm cache clean --force`
3. Ensure all scripts have explicit exit conditions
4. Check for postinstall or postbuild hooks

### 2. Lighthouse CI Failures

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

### 3. Build Cache Issues

**Warning:** "No build cache found"

**Solutions:**

- This is normal for first runs or fresh CI environments
- Cache will be created automatically for subsequent runs
- Can be safely ignored if build completes successfully

### 4. Test Failures in CI

**Common Causes:**

- Environment differences (JSDOM vs browser)
- Timing issues with async operations
- Missing browser APIs

**Solutions:**

- Use Jest setup files for mocking
- Add proper `await` and `findBy*` for async operations
- Mock browser APIs in `jest.setup.js`

### 5. TypeScript Errors in CI

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

# Check for security vulnerabilities
npm audit

# Update dependencies
npm update
```
