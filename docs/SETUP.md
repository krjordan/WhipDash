# 🚀 ZestDash Setup Guide

This guide will walk you through setting up ZestDash with your Shopify store, from creating API credentials to deploying your dashboard.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed on your machine
- A **Shopify store** (any plan works)
- **Admin access** to your Shopify store
- **Git** installed for cloning the repository

## 🏪 Shopify Store Setup

### Step 1: Create a Custom App

1. **Log into your Shopify Admin**
2. Navigate to **Settings** → **Apps and sales channels**
3. Click **Develop apps for your store**
4. If this is your first custom app, click **Allow custom app development**
5. Click **Create an app**
6. Enter an app name (e.g., "Sales Dashboard", "ZestDash", etc.)
7. Click **Create app**

### Step 2: Configure Admin API Scopes

1. In your new app, click **Configuration**
2. Scroll down to **Admin API access scopes**
3. Click **Configure**
4. Search for and enable the following scopes:
   - ✅ **`read_orders`** - Required to fetch order data
   - ✅ **`read_products`** (optional) - For future product features
5. Click **Save** to apply the scopes

### Step 3: Install and Generate Access Token

1. Click the **API credentials** tab
2. Note down your **API key** and **API secret key** (you'll need these later)
3. Click **Install app** button
4. Confirm the installation
5. Copy the **Admin API access token** that appears (this is only shown once!)

### Step 4: Note Your Store Domain

Your store domain is your Shopify URL, typically:

- Format: `your-store-name.myshopify.com`
- Example: `awesome-tees.myshopify.com`

## 💻 Local Development Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/zestdash.git
cd zestdash

# Install dependencies
npm install
```

### Step 2: Environment Configuration

1. **Copy the environment template:**

   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local` with your credentials:**

   ```bash
   # Your Shopify API credentials from Step 3 above
   SHOPIFY_API_KEY=your_api_key_here
   SHOPIFY_API_SECRET=your_api_secret_here
   SHOPIFY_SHOP=your-store-name.myshopify.com
   SHOPIFY_ACCESS_TOKEN=your_admin_api_access_token_here

   # Local development settings
   HOST_NAME=http://localhost:3000
   NODE_ENV=development
   ```

### Step 3: Start Development Server

```bash
npm run dev
```

Your dashboard should now be available at [http://localhost:3000](http://localhost:3000)!

### Step 4: Verify Connection

1. Open your dashboard in the browser
2. You should see your store's live order data
3. If you see errors, check the [Troubleshooting](#-troubleshooting) section below

## 🌐 Production Deployment

### Vercel (Recommended)

1. **Prepare your repository:**

   ```bash
   git add .
   git commit -m "feat: initial setup with Shopify integration"
   git push origin main
   ```

2. **Deploy to Vercel:**

   - Go to [vercel.com](https://vercel.com) and sign in
   - Click **Import Project**
   - Select your ZestDash repository
   - Click **Deploy**

3. **Configure Environment Variables:**

   - In your Vercel dashboard, go to your project
   - Navigate to **Settings** → **Environment Variables**
   - Add each variable:
     ```
     SHOPIFY_API_KEY = your_api_key
     SHOPIFY_API_SECRET = your_api_secret
     SHOPIFY_SHOP = your-store.myshopify.com
     SHOPIFY_ACCESS_TOKEN = your_access_token
     HOST_NAME = https://yourdomain.vercel.app
     NODE_ENV = production
     ```

4. **Redeploy:**
   - Go to **Deployments** tab
   - Click **Redeploy** to apply the environment variables

### Other Platforms

<details>
<summary>Netlify</summary>

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Site Settings → Environment Variables
5. Deploy your site

</details>

<details>
<summary>Railway</summary>

1. Connect your GitHub repository to Railway
2. Railway will auto-detect it's a Next.js app
3. Add environment variables in your project settings
4. Deploy with default settings

</details>

<details>
<summary>DigitalOcean App Platform</summary>

1. Create a new app from your GitHub repository
2. Configure build settings for Next.js
3. Add environment variables in the app spec
4. Deploy your application

</details>

## 🔧 Advanced Configuration

### Custom Domain (Production)

When using a custom domain, update your `HOST_NAME`:

```bash
# For custom domain
HOST_NAME=https://dashboard.yourdomain.com

# For Vercel subdomain
HOST_NAME=https://your-app.vercel.app
```

### API Rate Limiting

Shopify has API rate limits. ZestDash is designed to stay within these limits:

- **REST Admin API**: 40 requests per app per store per minute
- **GraphQL Admin API**: 1000 points per app per store per minute

The dashboard polls every 30 seconds during active sessions, well within these limits.

### Database Integration (Optional)

For production use, consider adding a database to cache order data:

1. **Recommended databases:**

   - Vercel Postgres (for Vercel deployments)
   - PlanetScale (MySQL-compatible)
   - Supabase (PostgreSQL)

2. **Benefits:**
   - Reduced API calls to Shopify
   - Historical data analysis
   - Faster dashboard loading

## 🚨 Troubleshooting

### Common Setup Issues

**❌ "Missing required Shopify environment variables"**

- **Solution**: Verify all variables in `.env.local` are set correctly
- **Check**: Ensure file is named `.env.local`, not `.env.example`

**❌ "Failed to fetch orders"**

- **Solution**: Verify your Shopify credentials are correct
- **Check**: Ensure your custom app has the `read_orders` scope enabled
- **Check**: Store domain includes `.myshopify.com`

**❌ "CORS errors" or "Unauthorized"**

- **Solution**: Update `HOST_NAME` to match your actual domain
- **Check**: In production, use your real URL (not localhost)

**❌ "App installation failed"**

- **Solution**: Make sure you have admin permissions on the Shopify store
- **Check**: Verify you're logged into the correct Shopify account

### Testing Your Setup

Run these commands to verify everything works:

```bash
# Check if all dependencies are installed
npm run type-check

# Run tests to verify API integration
npm run test

# Check if build works
npm run build

# Start production server locally
npm run start
```

### Environment Variables Checklist

- [ ] `SHOPIFY_API_KEY` - From your custom app's API credentials
- [ ] `SHOPIFY_API_SECRET` - From your custom app's API credentials
- [ ] `SHOPIFY_SHOP` - Your store domain (includes .myshopify.com)
- [ ] `SHOPIFY_ACCESS_TOKEN` - Generated when you installed your app
- [ ] `HOST_NAME` - Your app's URL (localhost for dev, your domain for prod)
- [ ] `NODE_ENV` - Set to 'development' or 'production'

## 🔒 Security Best Practices

1. **Never commit `.env.local`** - It's in `.gitignore` by default
2. **Use different apps** for development and production environments
3. **Regularly rotate** your access tokens
4. **Monitor** your API usage in Shopify Partner Dashboard
5. **Enable** two-factor authentication on your Shopify account

## 📞 Getting Help

Still having issues? Here's how to get help:

1. **Check our [Troubleshooting Guide](./TROUBLESHOOTING.md)**
2. **Search [existing issues](https://github.com/yourusername/zestdash/issues)**
3. **Create a [new issue](https://github.com/yourusername/zestdash/issues/new)** with:
   - Your setup steps
   - Error messages (remove sensitive data)
   - Environment (OS, Node version, etc.)

## 🎉 Next Steps

Once your dashboard is running:

- ✅ Explore the live order tracking features
- ✅ Try the different date filters
- ✅ Set up monitoring and alerts
- ✅ Customize the dashboard for your needs
- ✅ Consider contributing back to the project!

---

**Happy dashboarding! 📊**
