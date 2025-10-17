# Monitoring Agent Activity

This guide explains how to monitor your autonomous agents and understand when they're using Playwright browsers, API keys, and other resources to scrape affiliate marketplaces and build lead lists.

## Overview

Your agents perform various tasks that use different resources:

- **Playwright Browser**: Used for web scraping and lead discovery
- **Affiliate API Keys**: Used to fetch offers from AWIN, CJ, and ClickBank
- **Clay API Key**: Used for lead enrichment
- **OpenRouter API Key**: Used for AI-powered content analysis and decision making

## Monitoring Methods

### 1. Activity Monitor Page (`/activity`)

The Activity Monitor provides real-time visibility into all agent operations.

**Features:**
- Real-time task monitoring (auto-refreshes every 5 seconds)
- Filter by agent or task status
- Expandable task details showing:
  - Timing information (created, started, completed, duration)
  - Input parameters
  - Output results
  - Error messages (if any)
  - Resources used (browser, API calls)

**Key Metrics:**
- **Browser Sessions**: Number of completed tasks that used Playwright
- **API Calls**: Number of completed tasks that used affiliate/Clay APIs
- **Completed**: Total successful tasks
- **Running**: Currently executing tasks

**Task Indicators:**
- 🟣 **Browser Badge**: Task uses Playwright for web scraping
- 🟠 **API Badge**: Task uses API keys (affiliate networks or Clay)

### 2. Server Logs

All agent activities are logged to the server console with detailed prefixes:

#### Web Scraper Logs
```
[WEB-SCRAPER] 🌐 Launching Playwright Chromium browser...
[WEB-SCRAPER] ✅ Browser launched successfully
[WEB-SCRAPER] 🔍 Starting Google search for: "..." (max 10 results)
[WEB-SCRAPER] 📡 Navigating to Google...
[WEB-SCRAPER] ✅ Found 10 search results
[WEB-SCRAPER] 📄 Extracting content from: https://example.com
[WEB-SCRAPER] ✅ Extracted content: 2 emails, 1 phones
[WEB-SCRAPER] 🎯 Starting lead discovery for query: "..."
[WEB-SCRAPER] 📊 Processing 20 search results for lead qualification
[WEB-SCRAPER] ✅ Qualified lead found: https://example.com (buying intent: 75)
[WEB-SCRAPER] ⏭️  Skipping lead: https://example.com (buying intent too low: 25)
[WEB-SCRAPER] 🎉 Lead discovery complete: 8 qualified leads discovered
```

#### AWIN Affiliate Logs
```
[AWIN-AFFILIATE] 🔑 Checking AWIN API credentials...
[AWIN-AFFILIATE] ✅ Credentials found - Publisher ID: 12345
[AWIN-AFFILIATE] 📡 Making API request to AWIN: https://api.awin.com/...
[AWIN-AFFILIATE] ✅ Successfully fetched 150 programmes from AWIN
[AWIN-AFFILIATE] 📊 Offer stats: Avg CPS: 67.3
```

#### CJ Affiliate Logs
```
[CJ-AFFILIATE] 🔑 Checking CJ API credentials...
[CJ-AFFILIATE] ✅ Credentials found - Website ID: 67890
[CJ-AFFILIATE] 📡 Making API request to CJ: https://advertiser-lookup.api.cj.com/...
[CJ-AFFILIATE] ✅ Successfully fetched 120 advertisers from CJ
[CJ-AFFILIATE] 📊 Offer stats: Avg CPS: 71.2
```

#### ClickBank Logs
```
[CLICKBANK-AFFILIATE] 🔑 Checking ClickBank API credentials...
[CLICKBANK-AFFILIATE] ✅ Credentials found
[CLICKBANK-AFFILIATE] 📡 Making API request to ClickBank: https://api.clickbank.com/...
[CLICKBANK-AFFILIATE] ✅ Successfully fetched 200 products from ClickBank
[CLICKBANK-AFFILIATE] 📊 Offer stats: Avg CPS: 65.8, Avg Gravity: 45.2
```

### 3. Database Task Records

All agent tasks are stored in the `AgentTask` table with:
- Task type (e.g., `offer_sync`, `lead_discovery`)
- Status (pending, running, completed, failed)
- Input/output JSON data
- Timestamps
- Error messages

Query tasks programmatically:
```typescript
const tasks = await db.agentTask.findMany({
  where: {
    agentId: 'agent-id',
    type: 'offer_sync',
    status: 'completed',
  },
  orderBy: { createdAt: 'desc' },
});
```

## Task Types and Resources Used

### Tasks Using Playwright Browser

| Task Type | Description | Resources |
|-----------|-------------|-----------|
| `lead_discovery` | Searches Google and scrapes websites to find leads | 🟣 Browser |
| `web_search` | Generates and executes search queries | 🟣 Browser |
| `content_analysis` | Extracts and analyzes webpage content | 🟣 Browser |
| `lead_list_building` | Builds targeted lead lists via web scraping | 🟣 Browser |

### Tasks Using API Keys

| Task Type | Description | Resources |
|-----------|-------------|-----------|
| `offer_sync` | Fetches offers from AWIN, CJ, ClickBank | 🟠 AWIN API, CJ API, ClickBank API |
| `offer_scoring` | Re-scores existing offers | 🟠 OpenRouter API |
| `lead_enrichment` | Enriches leads with Clay | 🟠 Clay API |
| `offer_optimization` | Optimizes offer recommendations | 🟠 OpenRouter API |
| `persona_generation` | Creates customer personas | 🟠 OpenRouter API |
| `buying_signal_analysis` | Analyzes user behavior patterns | 🟠 OpenRouter API |
| `campaign_creation` | Generates marketing campaigns | 🟠 OpenRouter API |
| `outreach_generation` | Creates personalized emails | 🟠 OpenRouter API, SendGrid API |

## Understanding Task Output

### Offer Sync Task Output
```json
{
  "totalFetched": 470,
  "savedOffers": 385,
  "minScoreThreshold": 50,
  "sources": {
    "awin": 150,
    "cj": 120,
    "clickbank": 200
  }
}
```

**Interpretation:**
- Fetched 470 offers total across all platforms
- Saved 385 offers that met the minimum CPS threshold (50)
- AWIN contributed 150, CJ contributed 120, ClickBank contributed 200

### Lead Discovery Task Output
```json
{
  "leadsDiscovered": 8,
  "leadIds": ["lead-1", "lead-2", ...],
  "searchQuery": "tech startups looking for CRM solutions"
}
```

**Interpretation:**
- Found 8 qualified leads via web scraping
- Used Playwright to search Google and extract contact information
- Leads were qualified based on buying intent score (minimum 30)

### Lead Enrichment Task Output
```json
{
  "leadsEnriched": 7,
  "leadIds": ["lead-1", "lead-2", ...],
  "errors": ["Lead lead-x: No email found"],
  "successRate": 70
}
```

**Interpretation:**
- Successfully enriched 7 out of 10 leads using Clay API
- 70% success rate
- Some leads couldn't be enriched due to missing data

## Agent Execution Frequency

Different agent types run tasks at different intervals:

| Agent Type | Primary Task | Frequency |
|------------|-------------|-----------|
| Deal-Finder | `offer_sync` | Every 6 hours |
| Deal-Finder | `offer_scoring` | Between syncs |
| List-Builder | `lead_list_building` | Continuous (when leads < threshold) |
| List-Builder | `lead_enrichment` | When unenriched leads exist |
| Researcher | `lead_discovery` | When recent leads < 5 |
| Outreach | `outreach_generation` | When leads need outreach |
| Marketing-Agent | `campaign_creation` | When draft campaigns < threshold |

## Checking API Key Usage

### Via Activity Monitor
1. Go to `/activity`
2. Look for tasks with the 🟠 **API** badge
3. Expand task details to see which specific APIs were called
4. Check the "Resources Used" section for API-specific information

### Via Server Logs
Monitor your server console for API-related log entries. Each API call is logged with:
- Credential check status
- API endpoint being called
- Response status
- Number of items fetched
- Average scores/metrics

### Via Environment Variables
Check which API keys are configured in your `.env` file:
```bash
# Affiliate Networks
AWIN_API_TOKEN=your-token
AWIN_PUBLISHER_ID=your-id
CJ_API_KEY=your-key
CJ_WEBSITE_ID=your-id
CLICKBANK_API_KEY=your-key

# Lead Enrichment
CLAY_API_KEY=your-key

# AI Services
OPENROUTER_API_KEY=your-key

# Email
SENDGRID_API_KEY=your-key
```

## Troubleshooting

### No Browser Activity Showing
- Check if any agents of type `researcher` or `list_builder` are running
- Verify Playwright is installed (should be automatic in Docker)
- Check server logs for `[WEB-SCRAPER]` entries

### No API Calls Showing
- Verify API keys are set in `.env`
- Check if `deal_finder` agent is running
- Look for error messages in task details
- Common errors:
  - `401/403`: Invalid API credentials
  - `PRECONDITION_FAILED`: API keys not configured

### Tasks Stuck in "Running" Status
- Check server logs for errors
- Task may have crashed without updating status
- Restart the agent to clear stuck tasks

### High API Usage
- Review task frequency settings in agent configs
- Adjust `minCpsScore` in deal-finder config to filter more aggressively
- Reduce `maxLeadsPerRun` in list-builder config
- Consider pausing agents during off-hours

## Best Practices

1. **Monitor Regularly**: Check the Activity page daily to understand agent behavior
2. **Review Task Output**: Expand completed tasks to verify quality of results
3. **Watch for Errors**: Failed tasks may indicate API key issues or rate limits
4. **Optimize Thresholds**: Adjust CPS scores and lead qualification criteria based on results
5. **Balance Resources**: Don't run too many agents simultaneously to avoid rate limits
6. **Check Logs**: Server logs provide the most detailed information about operations

## Security Considerations

- API keys are only accessible server-side (never sent to the browser)
- All API calls are logged for audit purposes
- Task output may contain sensitive data (emails, phones) - handle appropriately
- Consider implementing rate limiting to prevent API abuse
- Regularly rotate API keys for security

## Summary

To answer "How do I know if my agent is actively using Playwright or API keys?":

1. **Real-time**: Visit `/activity` page - tasks show 🟣 Browser or 🟠 API badges
2. **Historical**: Check task details in Activity Monitor for complete execution history
3. **Live Monitoring**: Watch server console logs for `[WEB-SCRAPER]`, `[AWIN-AFFILIATE]`, `[CJ-AFFILIATE]`, `[CLICKBANK-AFFILIATE]` entries
4. **Database**: Query `AgentTask` table for programmatic access to task history
5. **Metrics**: Agent metrics track `offersSynced`, `leadsBuilt`, `leadsEnriched`, etc.

The system provides complete transparency into all agent operations, making it easy to monitor resource usage and verify that your agents are working as expected.
