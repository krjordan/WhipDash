# CI/CD Pipeline Setup

This repository includes a comprehensive GitHub Actions CI/CD pipeline that automatically builds, tests, lints, and deploys your Next.js application.

## Workflows Overview

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)

**Triggers:** Push/PR to `main` or `develop` branches

**Jobs:**

- **Lint & Test & Build**: Runs on Node.js 18.x and 20.x
  - ESLint checking
  - TypeScript type checking
  - Jest tests with coverage
  - Next.js build
  - Coverage upload to Codecov
- **Security Audit**: Dependency vulnerability scanning
- **Dependency Review**: Reviews new dependencies in PRs

### 2. Deployment (`.github/workflows/deploy.yml`)

**Triggers:** Push to `main` branch after CI passes

**Jobs:**

- **Deploy to Vercel**: Automatic production deployment

### 3. Code Quality (`.github/workflows/code-quality.yml`)

**Triggers:** Pull requests to `main` or `develop`

**Jobs:**

- **Bundle Analysis**: Analyzes build output and bundle size
- **Lighthouse CI**: Performance, accessibility, and SEO testing
- **Accessibility Tests**: Automated a11y testing with axe-core

## Required Secrets

Add these secrets to your GitHub repository settings:

### For Codecov (Optional)

- `CODECOV_TOKEN`: Your Codecov token for test coverage reporting

### For Vercel Deployment

- `VERCEL_TOKEN`: Your Vercel deployment token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### For Lighthouse CI (Optional)

- `LHCI_GITHUB_APP_TOKEN`: GitHub app token for Lighthouse CI

## Setup Instructions

### 1. Enable GitHub Actions

GitHub Actions should be enabled by default for your repository.

### 2. Configure Codecov (Optional)

1. Go to [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Copy the repository token
4. Add it as `CODECOV_TOKEN` secret in GitHub

### 3. Configure Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Follow the setup prompts
4. Get your tokens:

   ```bash
   # Get your token
   vercel token create

   # Get your org and project IDs
   vercel project ls
   ```

5. Add the tokens as GitHub secrets

### 4. Configure Lighthouse CI (Optional)

1. Follow the [Lighthouse CI GitHub Action setup](https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md#github-actions)
2. Add the token as a GitHub secret

## Local Development Commands

```bash
# Run all CI checks locally
npm run ci

# Individual commands
npm run lint              # ESLint
npm run lint:fix          # ESLint with auto-fix
npm run type-check        # TypeScript checking
npm run test              # Jest tests
npm run test:coverage     # Tests with coverage
npm run build             # Next.js build
npm run analyze           # Bundle analysis
```

## Branch Strategy

- **`main`**: Production branch - triggers deployment
- **`develop`**: Development branch - runs CI checks
- **Feature branches**: Create PRs to `develop` or `main`

## Quality Gates

The pipeline enforces these quality gates:

- ✅ All ESLint rules must pass
- ✅ TypeScript compilation must succeed
- ✅ All tests must pass
- ✅ Build must complete successfully
- ✅ Security audit must not find high-severity vulnerabilities
- ✅ Accessibility score must be ≥ 90%
- ⚠️ Performance score should be ≥ 80% (warning only)

## Workflow Status Badges

Add these to your main README.md:

```markdown
![CI/CD](https://github.com/yourusername/yourrepo/workflows/CI%2FCD%20Pipeline/badge.svg)
![Deploy](https://github.com/yourusername/yourrepo/workflows/Deploy%20to%20Production/badge.svg)
![Code Quality](https://github.com/yourusername/yourrepo/workflows/Code%20Quality/badge.svg)
```

## Troubleshooting

### Common Issues

1. **Tests failing in CI but passing locally**

   - Check Node.js version differences
   - Ensure all dependencies are in `package.json`
   - Verify environment variables

2. **Build failing**

   - Check TypeScript errors
   - Verify all imports are correct
   - Check for missing dependencies

3. **Deployment failing**

   - Verify Vercel tokens are correct
   - Check Vercel project configuration
   - Ensure build completes successfully

4. **Security audit failures**
   - Run `npm audit fix`
   - Update vulnerable dependencies
   - Consider using `npm audit --audit-level=moderate`

### Getting Help

- Check the Actions tab in your GitHub repository for detailed logs
- Review the workflow files for configuration details
- Check Vercel dashboard for deployment issues
