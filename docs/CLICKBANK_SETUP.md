# Clickbank Affiliate Integration Setup

This guide will help you set up the Clickbank affiliate integration to sync high-converting digital products into your offer database.

## Overview

Clickbank is a leading affiliate marketplace specializing in digital products. The integration allows you to:

- Automatically sync products from Clickbank's marketplace
- Access gravity scores (product popularity metrics)
- View commission rates and average earnings per sale
- Track recurring product opportunities
- Calculate Conversion Potential Scores (CPS) based on Clickbank metrics

## Prerequisites

1. A Clickbank account (sign up at https://www.clickbank.com/)
2. Developer API access enabled on your account

## Getting Your API Credentials

### Step 1: Create a Clickbank Account

1. Go to https://www.clickbank.com/
2. Click "Sign Up" and choose "Affiliate Account"
3. Complete the registration process
4. Verify your email address

### Step 2: Enable API Access

1. Log in to your Clickbank account
2. Navigate to **Settings** → **API Settings**
3. Click **"Request API Access"** if not already enabled
4. Once approved, you'll see your API credentials

### Step 3: Generate API Keys

1. In the API Settings section, click **"Generate New API Key"**
2. Give your key a descriptive name (e.g., "Affiliate Platform Integration")
3. Copy your **API Key** - you'll need this for the `CLICKBANK_API_KEY` environment variable
4. If you need Clerk API access (for advanced features), also copy your **Clerk Key**

### Step 4: Get Your Vendor ID (Optional)

If you're also a vendor on Clickbank:
1. Navigate to **Account Settings**
2. Your **Vendor ID** will be displayed in your account information
3. This is optional and only needed if you want to filter for specific vendor products

## Configuration

Add the following environment variables to your `.env` file:

```env
# Clickbank Affiliate Integration
CLICKBANK_API_KEY=your_api_key_here
CLICKBANK_CLERK_KEY=your_clerk_key_here  # Optional
CLICKBANK_VENDOR=your_vendor_id_here     # Optional
```

### Environment Variables Explained

- **CLICKBANK_API_KEY** (Required): Your Clickbank API key for accessing the marketplace API
- **CLICKBANK_CLERK_KEY** (Optional): Clerk API key for advanced reporting features
- **CLICKBANK_VENDOR** (Optional): Your vendor ID if you want to filter for specific products

## Using the Integration

### Syncing Offers

1. Navigate to the **Offers** page in your application
2. Click the **"Sync Offers"** button
3. Select **"Clickbank"** as the source (or it will sync by default)
4. The system will fetch and import products from Clickbank

### What Gets Synced

For each Clickbank product, the following information is imported:

- **Product Name**: The title of the product
- **Merchant**: The vendor name
- **Commission Rate**: Percentage or flat rate commission
- **Average Earnings Per Sale**: Historical average earnings
- **Gravity Score**: Clickbank's popularity metric (higher = more affiliates making sales)
- **Recurring Products**: Whether the product has recurring billing
- **Cookie Window**: 60 days (Clickbank standard)
- **Category**: Product category for better organization

### Understanding Clickbank Metrics

#### Gravity Score
- Measures how many unique affiliates have made sales in the last 12 weeks
- Higher gravity = more proven product with active affiliate sales
- Typical ranges:
  - 0-20: New or low-performing products
  - 20-50: Moderate performance
  - 50-100: Good performance
  - 100+: Excellent performance (hot products)

#### Conversion Potential Score (CPS)
Our system calculates a CPS based on:
- **Gravity Score** (0-50 points): Higher gravity = higher score
- **Earnings Per Sale** (0-30 points): Higher EPC = higher score
- **Recurring Products** (+20 points): Bonus for subscription products

### Best Practices

1. **Focus on Gravity**: Products with gravity scores above 20 typically perform well
2. **Check Recurring Products**: These provide ongoing commission income
3. **Monitor EPC**: Higher earnings per sale mean better commission potential
4. **Test Multiple Products**: Clickbank has thousands of products across many niches
5. **Regular Syncing**: Sync weekly to get updated gravity scores and new products

## Troubleshooting

### "Invalid Clickbank API credentials" Error

- Verify your `CLICKBANK_API_KEY` is correct
- Check that your API access is approved and active
- Ensure there are no extra spaces in your environment variables

### No Products Syncing

- Clickbank API may have rate limits - wait a few minutes and try again
- Check that your API key has marketplace access permissions
- Verify your Clickbank account is in good standing

### Products Missing Information

- Some products may not have all fields populated
- Gravity scores update weekly, so new products may show 0
- Contact Clickbank support if specific products are consistently missing data

## API Rate Limits

Clickbank typically allows:
- 1000 requests per hour for standard API access
- Higher limits available for approved partners

The integration automatically handles rate limiting, but avoid syncing more than once per hour.

## Support

For Clickbank-specific issues:
- Clickbank Support: https://support.clickbank.com/
- API Documentation: https://api.clickbank.com/

For integration issues:
- Check application logs for detailed error messages
- Ensure all environment variables are properly set
- Verify your Clickbank account has API access enabled
