# CJ Affiliate Integration Setup Guide

This guide will help you integrate your affiliate platform with CJ Affiliate (Commission Junction) to sync real offers.

## Prerequisites

1. A CJ Affiliate account (sign up at [https://www.cj.com](https://www.cj.com))
2. Publisher status approved by CJ
3. Access to CJ's API (available to approved publishers)

## Getting Your API Credentials

### Step 1: Obtain Your API Key (Developer Key)

1. Log in to your CJ Affiliate account at [https://members.cj.com](https://members.cj.com)
2. Navigate to **Account** → **Web Services**
3. Click on **Developer Key** or **API Access**
4. Generate a new API key if you don't have one
5. Copy your **Personal Access Token** or **Developer Key**

### Step 2: Find Your Website ID

1. In your CJ Affiliate account, go to **Account** → **Websites**
2. Find your website in the list
3. Note the **Website ID** (also called Company ID or Publisher ID)
4. This is typically a numeric value (e.g., `1234567`)

## Configuration

### Setting Environment Variables

Add your CJ Affiliate credentials to the `.env` file in the root of your project:

```env
# CJ Affiliate API Credentials
CJ_API_KEY=your_api_key_here
CJ_WEBSITE_ID=your_website_id_here
```

**Important Notes:**
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore` by default
- These credentials are only accessible on the server side for security

### Example Configuration

```env
CJ_API_KEY=Bearer_abc123def456...
CJ_WEBSITE_ID=1234567
```

## Using the Integration

### Syncing Offers

Once configured, you can sync offers from CJ Affiliate:

1. Navigate to the **Offers** page in your application
2. Click the **Sync Offers** button in the top right
3. The system will fetch all advertisers you're joined with from CJ
4. Offers will be automatically created or updated in your database

### What Gets Synced

The integration syncs the following data for each advertiser:

- **Advertiser Name** → Offer name and merchant
- **Commission Structure** → Payout information
- **Performance Metrics** → EPC (Earnings Per Click)
- **Cookie Duration** → Cookie window in days
- **Categories** → Primary and secondary categories
- **Network Rank** → Used to calculate CPS (Conversion Potential Score)
- **Program URL** → Link to the advertiser's program page

### Conversion Potential Score (CPS)

The system automatically calculates a CPS for each offer based on:
- Network Rank (1-5, with 1 being best)
- 7-day or 3-month EPC
- Formula: `networkRankScore + epcScore`

This helps you identify the most promising offers at a glance.

## API Details

### Endpoint Used

```
GET https://advertiser-lookup.api.cj.com/v3/advertiser-lookup
```

### Parameters

- `website-id`: Your CJ Website ID
- `advertiser-ids`: Set to "joined" to only fetch advertisers you're approved for
- `records-per-page`: Number of results per page (default: 100)
- `page-number`: Pagination (currently fetches first page only)

### Rate Limits

CJ Affiliate API has rate limits:
- Typically 100 requests per minute
- May vary based on your account level

The integration fetches up to 100 offers per sync. For accounts with more than 100 joined advertisers, pagination would need to be implemented.

## Troubleshooting

### Error: "CJ Affiliate API credentials not configured"

**Solution:** Make sure you've set both `CJ_API_KEY` and `CJ_WEBSITE_ID` in your `.env` file and restarted your application.

### Error: "Invalid CJ Affiliate API credentials"

**Possible causes:**
1. Your API key is incorrect or expired
2. Your API key doesn't have the correct permissions
3. Your Website ID is incorrect

**Solution:**
- Verify your credentials in the CJ dashboard
- Regenerate your API key if needed
- Ensure your API key has "Advertiser Lookup" permissions

### Error: "CJ Affiliate API error: 403 Forbidden"

**Possible causes:**
1. Your website is not approved by CJ
2. Your API access has been revoked
3. Your account is not in good standing

**Solution:**
- Check your account status in the CJ dashboard
- Contact CJ support if your account should have API access

### No Offers Returned

**Possible causes:**
1. You haven't joined any advertiser programs yet
2. Your joined programs haven't been approved
3. The advertisers you've joined don't have active programs

**Solution:**
- Log in to CJ and join some advertiser programs
- Wait for approval (can take 1-7 days)
- Check that the programs you've joined are currently active

### Duplicate Offers

The integration uses `source` and `sourceId` to prevent duplicates:
- Existing offers are **updated** with new data
- New offers are **created**
- Demo offers use `source: "demo"` to avoid conflicts

## Advanced Configuration

### Filtering Advertisers

To modify which advertisers are fetched, edit `src/server/services/cj-affiliate.ts`:

```typescript
const params = new URLSearchParams({
  "website-id": env.CJ_WEBSITE_ID,
  "advertiser-ids": "joined", // Change this to filter differently
  "records-per-page": "100",
  "page-number": "1",
});
```

Options for `advertiser-ids`:
- `"joined"` - Only advertisers you've joined (recommended)
- `"1234,5678"` - Specific advertiser IDs
- Leave empty to fetch all advertisers

### Implementing Pagination

To fetch more than 100 offers, implement pagination:

```typescript
let pageNumber = 1;
let hasMore = true;
const allOffers = [];

while (hasMore) {
  const params = new URLSearchParams({
    "website-id": env.CJ_WEBSITE_ID,
    "advertiser-ids": "joined",
    "records-per-page": "100",
    "page-number": pageNumber.toString(),
  });
  
  // Fetch and process...
  
  pageNumber++;
  hasMore = offers.length === 100; // Continue if we got a full page
}
```

### Scheduling Automatic Syncs

To automatically sync offers on a schedule, you could:

1. Use a cron job to call the sync endpoint
2. Implement a background job scheduler
3. Use a service like Vercel Cron or AWS EventBridge

Example with a daily cron:
```bash
# Run daily at 2 AM
0 2 * * * curl -X POST https://your-app.com/api/trpc/offers.sync
```

## Support

### CJ Affiliate Support
- Help Center: [https://help.cj.com](https://help.cj.com)
- Email: publishersupport@cj.com
- Phone: Available in your CJ dashboard

### Integration Issues
- Check the browser console for client-side errors
- Check server logs for API errors
- Review this documentation for common issues

## Next Steps

After setting up CJ Affiliate:

1. **Join More Programs**: Browse CJ's advertiser directory and join programs relevant to your audience
2. **Configure Other Networks**: The platform is designed to support multiple affiliate networks (Impact, ShareASale, etc.)
3. **Create Campaigns**: Use the synced offers to create targeted campaigns for your personas
4. **Monitor Performance**: Track which offers perform best and optimize accordingly

## Security Notes

- API keys are stored as environment variables, never in code
- Credentials are only accessible server-side
- Never expose your API key in client-side code or logs
- Rotate your API key periodically for security
- Use HTTPS for all API communications (handled automatically)
