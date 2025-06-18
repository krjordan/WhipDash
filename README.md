This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Shopify API Integration

This application includes live Shopify integration for real-time sales and order tracking. When a session is started, the app will automatically fetch and display live data from your Shopify store.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
SHOPIFY_API_KEY=your_shopify_api_key_here
SHOPIFY_API_SECRET=your_shopify_api_secret_here
SHOPIFY_SHOP=your-shop-name.myshopify.com
SHOPIFY_ACCESS_TOKEN=your_shopify_access_token_here
HOST_NAME=http://localhost:3000
NODE_ENV=development
```

### Features

- **Live Sales Tracking**: Real-time sales data updates from Shopify orders
- **Order Count Monitoring**: Live order count with automatic refresh during active sessions
- **Backward Compatibility**: Falls back to local state when Shopify API is unavailable
- **Error Handling**: Graceful error handling with user-friendly error messages
- **Auto-refresh**: Polls Shopify API every 30 seconds during live sessions

### API Endpoints

- `GET /api/health` - API health check

- `GET /api/orders/totals` - Fetch orders with detailed financial breakdown

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
