# Clay Data Enrichment Integration Setup

This guide will help you set up the Clay integration to automatically enrich your lead data with contact information, company details, and social profiles.

## Overview

Clay (app.clay.com) is a data enrichment and automation platform that helps you:

- Find and verify email addresses
- Enrich company information
- Discover social media profiles (LinkedIn, Twitter)
- Get technographic data (technologies used by companies)
- Enhance lead profiles with job titles, locations, and more

## Prerequisites

1. A Clay account (sign up at https://app.clay.com/)
2. An active Clay subscription with API access
3. Available enrichment credits

## Getting Your API Credentials

### Step 1: Create a Clay Account

1. Go to https://app.clay.com/
2. Click **"Sign Up"** or **"Get Started"**
3. Choose a plan that includes API access (typically Pro or higher)
4. Complete the registration and payment process

### Step 2: Generate an API Key

1. Log in to your Clay account
2. Click on your profile icon in the top-right corner
3. Select **"Settings"** or **"API Keys"**
4. Navigate to the **"API"** or **"Developers"** section
5. Click **"Generate New API Key"**
6. Give your key a descriptive name (e.g., "Affiliate Platform Integration")
7. Copy the API key immediately - it won't be shown again
8. Store it securely

### Step 3: Verify API Access

1. Check that your Clay plan includes API access
2. Verify you have available enrichment credits
3. Review your rate limits in the API settings

## Configuration

Add the following environment variable to your `.env` file:

```env
# Clay Data Enrichment Integration
CLAY_API_KEY=your_clay_api_key_here
```

### Environment Variables Explained

- **CLAY_API_KEY** (Required): Your Clay API key for accessing enrichment services

## Using the Integration

### Enriching Individual Leads

1. Navigate to the **Leads** page in your application
2. Click on a lead to open the details modal
3. In the **"Data Enrichment"** section, you'll see two options:
   - **"Enrich with Clay"**: Full enrichment with all available data
   - **"Find Email"**: Quick email lookup only

#### Full Enrichment
Click **"Enrich with Clay"** to:
- Find or verify email address
- Get phone number (if available)
- Discover LinkedIn and Twitter profiles
- Enrich company information (size, industry)
- Get job title and location
- Identify technologies used by the company

#### Email-Only Enrichment
Click **"Find Email"** to:
- Quickly find an email address for the lead
- Requires lead to have name and company information
- Uses less enrichment credits

### Batch Enrichment

For enriching multiple leads at once:
1. Select leads from the leads list
2. Use the batch actions menu
3. Choose **"Enrich Selected Leads with Clay"**
4. Up to 50 leads can be enriched per batch

### What Gets Enriched

Clay can provide the following data points:

#### Contact Information
- ✉️ **Email Address**: Professional email
- 📱 **Phone Number**: Direct dial or mobile
- 🔗 **LinkedIn URL**: Professional profile
- 🐦 **Twitter URL**: Social media handle

#### Company Information
- 🏢 **Company Name**: Full legal name
- 🌐 **Company Website**: Official website
- 📊 **Company Size**: Employee count range
- 🏭 **Industry**: Primary business sector
- 💻 **Technologies**: Tech stack used

#### Personal Information
- 👤 **Job Title**: Current position
- 📍 **Location**: City/country
- 🎯 **Confidence Score**: Data accuracy confidence (0-100%)

### Viewing Enriched Data

After enrichment, the lead details will show:
- ✅ **Enrichment Status Badge**: Shows when the lead was last enriched
- 📊 **Confidence Score**: How confident Clay is in the data accuracy
- 📋 **Enriched Fields**: All additional data points discovered
- 🔄 **Re-enrichment Option**: Update data if needed

## Best Practices

### 1. Strategic Enrichment
- Enrich leads that have shown buying signals first
- Focus on leads with incomplete contact information
- Prioritize high-value leads for full enrichment

### 2. Credit Management
- Full enrichment uses more credits than email-only lookup
- Check your Clay dashboard for credit usage
- Set up billing alerts in Clay to avoid running out

### 3. Data Quality
- Higher confidence scores (>70%) indicate more reliable data
- Re-enrich leads periodically (e.g., every 6 months) to keep data fresh
- Verify critical information before important outreach

### 4. Privacy & Compliance
- Only enrich leads you have a legitimate business reason to contact
- Ensure compliance with GDPR, CCPA, and other data protection regulations
- Respect opt-outs and unsubscribe requests
- Store enriched data securely

### 5. Workflow Integration
- Enrich leads immediately after discovery for complete profiles
- Use batch enrichment during off-peak hours
- Set up automated enrichment for new leads via agents

## Understanding Enrichment Results

### Confidence Scores
- **90-100%**: Very high confidence - data is highly reliable
- **70-89%**: High confidence - data is likely accurate
- **50-69%**: Medium confidence - verify before critical use
- **Below 50%**: Low confidence - manual verification recommended

### Partial Enrichment
Not all fields may be available for every lead:
- Some professionals have limited online presence
- Privacy settings may restrict data access
- Smaller companies may have less public information
- Recent job changes may not be reflected yet

## Pricing & Credits

Clay operates on a credit-based system:
- **Email Lookup**: ~1-2 credits per search
- **Full Enrichment**: ~5-10 credits per lead
- **Company Data**: ~2-3 credits
- **Social Profiles**: ~1-2 credits each

Check your Clay dashboard for:
- Current credit balance
- Monthly credit allocation
- Credit usage history
- Billing and plan details

## Troubleshooting

### "Clay API credentials not configured" Error
- Verify `CLAY_API_KEY` is set in your `.env` file
- Ensure there are no extra spaces or quotes
- Restart the application after adding the variable

### "Invalid Clay API credentials" Error
- Check that your API key is correct
- Verify your Clay subscription is active
- Ensure your API key hasn't been revoked

### No Data Found
- Lead may have limited online presence
- Try providing more information (company website, LinkedIn URL)
- Some data may not be publicly available
- Check Clay's data sources for coverage in specific regions

### Rate Limit Errors
- Clay has API rate limits based on your plan
- Spread out batch enrichments
- Contact Clay support for higher limits

### Insufficient Credits
- Check your credit balance in Clay dashboard
- Upgrade your plan for more credits
- Purchase additional credit packs

## API Rate Limits

Clay typically allows:
- **Standard Plan**: 100 requests per minute
- **Pro Plan**: 300 requests per minute
- **Enterprise**: Custom limits

The integration automatically handles rate limiting and retries.

## Support

### Clay Support
- Clay Help Center: https://help.clay.com/
- Email: support@clay.com
- In-app chat support (available in Clay dashboard)
- API Documentation: https://docs.clay.com/

### Integration Support
- Check application logs for detailed error messages
- Verify environment variables are properly set
- Ensure your Clay subscription includes API access
- Test with a single lead before batch enrichment

## Advanced Features

### Custom Enrichment Workflows
Clay supports custom enrichment workflows. Contact Clay support to:
- Set up custom data sources
- Configure specific enrichment rules
- Integrate proprietary databases
- Create custom API endpoints

### Data Quality Monitoring
Monitor enrichment quality:
- Track confidence scores over time
- Identify data gaps
- Measure enrichment success rates
- Optimize credit usage

## Security & Compliance

### Data Protection
- All API calls use HTTPS encryption
- API keys should be stored securely as environment variables
- Never commit API keys to version control
- Rotate API keys periodically

### Compliance
- Clay is GDPR and CCPA compliant
- Review Clay's privacy policy and terms of service
- Ensure your use case complies with data protection laws
- Maintain records of consent and legitimate interest

### Data Retention
- Enriched data is stored in your database
- Implement data retention policies
- Provide data deletion upon request
- Regular data audits recommended
