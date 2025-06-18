# Contributing to ZestDash 🤝

Thank you for your interest in contributing to ZestDash! This project is **completely open source** and we welcome contributions from developers of all skill levels.

## 🎯 How to Contribute

There are many ways to contribute to ZestDash:

- 🐛 **Report bugs** - Help us identify and fix issues
- 💡 **Suggest features** - Share ideas for new functionality
- 📝 **Improve documentation** - Help make our docs clearer
- 🔧 **Submit code** - Fix bugs or implement new features
- 🧪 **Write tests** - Improve our test coverage
- 🎨 **Design improvements** - Enhance the UI/UX

## 🚀 Getting Started

### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/zestdash.git
cd zestdash

# Add the original repository as upstream
git remote add upstream https://github.com/ORIGINAL_OWNER/zestdash.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Add your Shopify credentials to .env.local
# (See SETUP.md for detailed instructions)

# Start development server
npm run dev
```

### 3. Create a Feature Branch

```bash
# Create and switch to a new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

## 📋 Development Guidelines

### Code Style

- **TypeScript** - All new code should be written in TypeScript
- **ESLint** - Follow the existing ESLint configuration
- **Prettier** - Code formatting is handled by ESLint
- **Naming** - Use descriptive, camelCase names for variables and functions

### Testing Requirements

- **Write tests** for all new features and bug fixes
- **Maintain coverage** - Aim for 80%+ test coverage
- **Test types:**
  - Unit tests for components and utilities
  - Integration tests for API endpoints
  - Mock Shopify API calls in tests

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Commit Messages

We follow [Conventional Commits](https://conventionalcommits.org/):

```bash
# Format: type(scope): description
feat(components): add order filtering functionality
fix(api): resolve authentication timeout issue
docs(readme): update setup instructions
test(orders): add integration tests for totals endpoint
```

**Types:**

- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Build process or auxiliary tool changes

### Pull Request Process

1. **Run the full CI suite locally:**

   ```bash
   npm run ci
   ```

2. **Update documentation** if needed
3. **Add tests** for new functionality
4. **Update CHANGELOG** if making user-facing changes
5. **Fill out the PR template** completely

## 🔍 Code Review Guidelines

### For Contributors

- **Self-review** your code before submitting
- **Keep PRs focused** - One feature/fix per PR
- **Write clear descriptions** - Explain what and why
- **Respond promptly** to review feedback
- **Test thoroughly** on different screen sizes

### For Reviewers

- **Be constructive** and helpful in feedback
- **Check functionality** works as expected
- **Verify tests** pass and coverage is maintained
- **Review security** implications
- **Test on mobile** devices

## 🐛 Reporting Issues

When reporting bugs, please include:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **Environment details** (OS, Node version, browser)
- **Screenshots** if applicable
- **Console errors** if any

Use our issue templates:

- 🐛 [Bug Report](.github/ISSUE_TEMPLATE/bug_report.md)
- 💡 [Feature Request](.github/ISSUE_TEMPLATE/feature_request.md)

## 💡 Feature Requests

We love new ideas! When suggesting features:

- **Check existing issues** to avoid duplicates
- **Explain the use case** - why would this be useful?
- **Describe the solution** you have in mind
- **Consider alternatives** - are there other ways to solve this?
- **Think about scope** - should this be core or a plugin?

## 📚 Areas for Contribution

### High Priority

- 🔐 **Authentication improvements** - Better session handling
- 📊 **More dashboard widgets** - Additional metrics and charts
- 🎨 **UI/UX enhancements** - Improved responsiveness and accessibility
- 🔍 **Search and filtering** - Better order search capabilities
- 📈 **Analytics features** - Trend analysis and forecasting

### Good First Issues

Look for issues labeled `good first issue` - these are perfect for new contributors:

- Documentation improvements
- UI tweaks and styling
- Adding tests
- Small feature additions
- Bug fixes in isolated components

### Advanced Features

- 🗄️ **Database integration** - Caching and historical data
- 📱 **Mobile app** - React Native companion app
- 🔌 **Plugin system** - Extensible architecture
- 🌍 **Internationalization** - Multi-language support
- 📧 **Notifications** - Email/SMS alerts for events

## 🏗️ Project Structure

```
zestdash/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/         # API routes
│   │   └── page.tsx     # Main dashboard page
│   ├── components/      # React components
│   │   ├── ui/         # shadcn/ui components
│   │   └── *.tsx       # Custom components
│   ├── lib/            # Utilities and APIs
│   └── types/          # TypeScript definitions
├── docs/               # Documentation
├── public/            # Static assets
└── tests/             # Test configuration
```

## 🔧 Local Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues
npm run type-check   # TypeScript type checking
npm run test         # Run tests
npm run ci           # Run full CI suite locally
npm run analyze      # Analyze bundle size
```

## 🚀 Release Process

1. **Create release branch** from `main`
2. **Update version** in `package.json`
3. **Update CHANGELOG** with new features and fixes
4. **Create PR** for release
5. **Tag release** after merge
6. **Deploy** automatically via GitHub Actions

## ❓ Questions?

- 💬 [GitHub Discussions](https://github.com/OWNER/zestdash/discussions) - Ask questions and share ideas
- 📖 [Documentation](./docs/) - Check our guides and API docs
- 🐛 [Issues](https://github.com/OWNER/zestdash/issues) - Report bugs or request features

## 🙏 Recognition

Contributors are recognized in:

- **README** - Contributors section
- **CHANGELOG** - Feature/fix attributions
- **Releases** - GitHub release notes
- **Discord** - Special contributor role (coming soon!)

---

**Thank you for helping make ZestDash better! 🎉**
