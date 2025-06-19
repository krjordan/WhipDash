# WhipDash 🚀

[![CI/CD Pipeline](https://github.com/krjordan/whipdash/workflows/CI%2FCD%20Pipeline/badge.svg)](https://github.com/krjordan/whipdash/actions/workflows/ci.yml) [![Deploy to Production](https://github.com/krjordan/whipdash/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/krjordan/whipdash/actions/workflows/deploy.yml) [![Code Quality](https://github.com/krjordan/whipdash/workflows/Code%20Quality/badge.svg)](https://github.com/krjordan/whipdash/actions/workflows/code-quality.yml) [![codecov](https://codecov.io/gh/krjordan/whipdash/branch/main/graph/badge.svg)](https://codecov.io/gh/krjordan/whipdash) [![Known Vulnerabilities](https://snyk.io/test/github/krjordan/whipdash/badge.svg)](https://snyk.io/test/github/krjordan/whipdash)

An open source **live/event sales dashboard** for Shopify stores built with Next.js, TypeScript, and Tailwind CSS. Get real-time insights into your store's performance with beautiful, responsive dashboards.

> **Note**: This repository will remain **completely open source**. A premium hosted version with additional features will be available separately.

## ✨ Features

- 📊 **Real-time Sales Tracking** - Live order updates from your Shopify store
- 🎯 **Order Analytics** - Detailed financial breakdowns and totals
- 🎨 **Modern UI** - Beautiful, responsive design with dark/light mode
- ⚡ **High Performance** - Built with Next.js 15 and React 19
- 🔄 **Auto-refresh** - Live data updates every 30 seconds during active sessions
- 🛡️ **Type Safe** - Full TypeScript implementation
- 🧪 **Well Tested** - Comprehensive test suite with Jest and Testing Library
- 📱 **Mobile Friendly** - Responsive design works on all devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun
- A Shopify store with API access

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/whipdash.git
cd whipdash
npm install
```

### 2. Set Up Environment Variables

Copy the example environment file and configure your Shopify credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Shopify store details:

```bash
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_SHOP=your-store-name.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here
HOST_NAME=http://localhost:3000
NODE_ENV=development
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your dashboard!

## 🔧 Shopify Setup Guide

To connect your Shopify store, you'll need to create a custom app and get API credentials:

### Step 1: Create a Custom App

1. Go to your Shopify Admin → **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name your app (e.g., "My Sales Dashboard")

### Step 2: Configure API Scopes

1. Click **Configure Admin API scopes**
2. Enable the following scopes:
   - `read_orders` - Required for order data

### Step 3: Generate Credentials

1. Click **API credentials** tab
2. Note down your **API key** and **API secret key**
3. Click **Install app** to generate an **Admin API access token**

### Step 4: Update Environment Variables

Use the credentials in your `.env.local` file:

```bash
SHOPIFY_API_KEY=your_api_key_from_step_3
SHOPIFY_API_SECRET=your_api_secret_from_step_3
SHOPIFY_SHOP=your-store.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_access_token_from_step_3
```

## 📦 Available Scripts

```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run type-check   # Run TypeScript type checking
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
npm run analyze      # Analyze bundle size
npm run ci           # Run all CI checks locally
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub** and connect your repository to Vercel
2. **Set Environment Variables** in your Vercel dashboard:
   ```bash
   SHOPIFY_API_KEY=your_api_key
   SHOPIFY_API_SECRET=your_api_secret
   SHOPIFY_SHOP=your-store.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_access_token
   HOST_NAME=https://yourdomain.vercel.app
   NODE_ENV=production
   ```
3. **Deploy** - Vercel will automatically build and deploy your app

### Other Deployment Options

The app can be deployed to any platform that supports Next.js:

- **Netlify**: Set the same environment variables in your site settings
- **Railway**: Add environment variables in your project settings
- **DigitalOcean App Platform**: Configure environment variables in the app spec
- **Docker**: Build a container and set environment variables at runtime

Just ensure all environment variables are properly configured on your chosen platform.

## 🏗️ Project Structure

```
whipdash/
├── src/
│   ├── app/                # Next.js 13+ App Router
│   │   ├── api/           # API routes
│   │   │   ├── health/    # Health check endpoint
│   │   │   └── orders/    # Orders API endpoints
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── [components]  # Custom dashboard components
│   ├── lib/              # Utility libraries
│   │   ├── shopify.ts    # Shopify API client
│   │   └── utils.ts      # Helper utilities
│   └── types/            # TypeScript type definitions
├── docs/                 # Documentation
├── public/              # Static assets
└── [config files]       # Various config files
```

## 🧪 Testing

We maintain comprehensive test coverage:

```bash
npm run test              # Run all tests
npm run test:coverage     # Run with coverage report
npm run test:watch        # Run in watch mode
```

Tests include:

- **Unit tests** for components and utilities
- **Integration tests** for API endpoints
- **API mocking** for Shopify integration
- **Accessibility testing** in CI/CD

## 🛠️ Development

### Code Quality

This project uses:

- **ESLint** with Next.js config
- **TypeScript** for type safety
- **Prettier** for code formatting (via ESLint)
- **Jest** for testing
- **GitHub Actions** for CI/CD

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Run the full CI suite: `npm run ci`
5. Commit using conventional commits: `git commit -m "feat: add amazing feature"`
6. Push and create a Pull Request

## 🔍 API Endpoints

- `GET /api/health` - API health check
- `GET /api/orders/totals` - Fetch orders with financial breakdown
  - Query params: `today`, `created_at_min`, `created_at_max`

## 🚨 Troubleshooting

Having issues? Check our [troubleshooting guide](./docs/TROUBLESHOOTING.md) for common problems and solutions.

### Common Issues

1. **"Missing required Shopify environment variables"**

   - Ensure all variables in `.env.local` are set correctly
   - Check that your `.env.local` file exists and is not `.env.example`

2. **"Failed to fetch orders"**

   - Verify your Shopify credentials are correct
   - Ensure your custom app has the `read_orders` scope
   - Check that your store domain is correct (include `.myshopify.com`)

3. **Build or deployment issues**
   - See [CI/CD Setup Guide](./docs/CI-CD-SETUP.md)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/whipdash/issues)
- 💬 [Discussions](https://github.com/yourusername/whipdash/discussions)
