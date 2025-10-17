# Awin Affiliate Integration Setup Guide

This guide will help you integrate your affiliate platform with Awin to sync real offers.

## Prerequisites

1. An Awin publisher account (sign up at [https://www.awin.com](https://www.awin.com))
2. Publisher status approved by Awin
3. Access to Awin's API (available to approved publishers)

## Getting Your API Credentials

### Step 1: Obtain Your API Token

1. Log in to your Awin publisher account at [https://ui.awin.com](https://ui.awin.com)
2. Navigate to **Account** → **API Credentials** or **Settings** → **API**
3. Click on **Generate New Token** or **Create API Token**
4. Give your token a descriptive name (e.g., "Affiliate Platform Integration")
5. Select the required permissions:
   - **Read** access for Programmes
   - **Read** access for Advertiser Information
6. Copy your **API Token** (OAuth2 Bearer token)
7. Store it securely - you won't be able to see it again

### Step 2: Find Your Publisher ID

1. In your Awin account, go to **Account** → **Profile** or **Settings**
2. Your **Publisher ID** is displayed in your account information
3. This is typically a numeric value (e.g., `123456`)
4. You can also find it in the URL when logged into Awin: `ui.awin.com/merchant-profile/publisher/{PUBLISHER_ID}`

## Configuration

### Setting Environment Variables

Add your Awin credentials to the `.env` file in the root of your project:

```env
# Awin API Credentials
AWIN_API_TOKEN=your_api_token_here
AWIN_PUBLISHER_ID=your_publisher_id_here
```

**Important Notes:**
- Never commit your `.env` file to version control
- The `.env` file is already in `.gitignore` by default
- These credentials are only accessible on the server side for security

### Example Configuration

```env
AWIN_API_TOKEN=abc123def456ghi789...
AWIN_PUBLISHER_ID=123456
```

## Using the Integration

### Syncing Offers

Once configured, you can sync offers from Awin:

1. Navigate to the **Offers** page in your application
2. Click the **Sync Offers** button in the top right
3. The system will fetch all programmes (advertisers) you're joined with from Awin
4. Offers will be automatically created or updated in your database

### What Gets Synced

The integration syncs the following data for each programme:

- **Programme Name** → Offer name and merchant
- **Commission Structure** → Payout information from commission groups
- **Performance Metrics** → EPC (Earnings Per Click) and average commission
- **Cookie Duration** → Cookie window in days
- **Categories** → Primary category
- **Region** → Geographic targeting information
- **Programme URL** → Click-through link and display URL
- **Logo** → Programme logo image (if available)

### Conversion Potential Score (CPS)

The system automatically calculates a CPS for each offer based on:
- EPC (Earnings Per Click)
- Cookie duration (longer is better)
- Base score for active programmes
- Formula: `baseScore + epcScore + cookieScore`

This helps you identify the most promising offers at a glance.

## API Details

### Endpoint Used

```
GET https://api.awin.com/publishers/{publisherId}/programmes
```

### Parameters

- `relationship`: Set to "joined" to only fetch programmes you're approved for

### Authentication

- Uses OAuth2 Bearer token authentication
- Token is passed in the `Authorization` header

### Rate Limits

Awin API has rate limits:
- Typically varies by account level
- Standard accounts: ~100 requests per minute
- Check your Awin account for specific limits

## Troubleshooting

### Error: "Awin API credentials not configured"

**Solution:** Make sure you've set both `AWIN_API_TOKEN` and `AWIN_PUBLISHER_ID` in your `.env` file and restarted your application.

### Error: "Invalid Awin API credentials"

**Possible causes:**
1. Your API token is incorrect or expired
2. Your API token doesn't have the correct permissions
3. Your Publisher ID is incorrect

**Solution:**
- Verify your credentials in the Awin dashboard
- Regenerate your API token if needed
- Ensure your API token has "Read" permissions for Programmes

### Error: "Awin API error: 403 Forbidden"

**Possible causes:**
1. Your API token has been revoked
2. Your account is not in good standing
3. You're trying to access programmes you don't have permission for

**Solution:**
- Check your account status in the Awin dashboard
- Verify your API token is still active
- Contact Awin support if your account should have API access

### No Offers Returned

**Possible causes:**
1. You haven't joined any advertiser programmes yet
2. Your joined programmes haven't been approved
3. The programmes you've joined are not currently active

**Solution:**
- Log in to Awin and join some advertiser programmes
- Wait for approval (can take 1-7 days depending on the advertiser)
- Check that the programmes you've joined are currently active

### Duplicate Offers

The integration uses `source` and `sourceId` to prevent duplicates:
- Existing offers are **updated** with new data
- New offers are **created**
- Demo offers use `source: "demo"` to avoid conflicts

## Advanced Configuration

### Filtering Programmes

To modify which programmes are fetched, edit `src/server/services/awin-affiliate.ts`:

```typescript
const params = new URLSearchParams({
  relationship: "joined", // Options: "joined", "pending", "approved", "declined"
});
```

### Fetching Additional Data

Awin's API provides additional endpoints for:
- Commission groups details
- Programme performance metrics
- Transaction data
- Creative assets

These can be integrated by extending the service file.

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

## Awin API Resources

### Official Documentation
- API Documentation: [https://wiki.awin.com/index.php/API](https://wiki.awin.com/index.php/API)
- Publisher API Guide: [https://wiki.awin.com/index.php/Publisher_API](https://wiki.awin.com/index.php/Publisher_API)
- OAuth2 Authentication: [https://wiki.awin.com/index.php/OAuth_2.0](https://wiki.awin.com/index.php/OAuth_2.0)

### Support
- Help Center: [https://www.awin.com/gb/help](https://www.awin.com/gb/help)
- Publisher Support: Available through your Awin dashboard
- Email: publishersupport@awin.com (region-specific)

### Integration Issues
- Check the browser console for client-side errors
- Check server logs for API errors
- Review this documentation for common issues
- Contact Awin support for API-specific issues

## Next Steps

After setting up Awin:

1. **Join More Programmes**: Browse Awin's advertiser directory and join programmes relevant to your audience
2. **Configure Other Networks**: The platform is designed to support multiple affiliate networks (Impact, ShareASale, etc.)
3. **Create Campaigns**: Use the synced offers to create targeted campaigns for your personas
4. **Monitor Performance**: Track which offers perform best and optimize accordingly

## Security Notes

- API tokens are stored as environment variables, never in code
- Credentials are only accessible server-side
- Never expose your API token in client-side code or logs
- Rotate your API token periodically for security (recommended: every 90 days)
- Use HTTPS for all API communications (handled automatically)
- Awin tokens can be revoked instantly if compromised

## Differences from Other Networks

### Awin vs CJ Affiliate
- **Authentication**: Awin uses OAuth2 Bearer tokens; CJ uses API keys
- **Structure**: Awin calls them "programmes"; CJ calls them "advertisers"
- **API Design**: Awin has a more RESTful API design
- **Commission Groups**: Awin provides detailed commission group structures

### Awin Advantages
- Strong presence in Europe and UK
- Wide variety of advertisers across categories
- Good API documentation and support
- Flexible commission structures
- Regular payment schedules
