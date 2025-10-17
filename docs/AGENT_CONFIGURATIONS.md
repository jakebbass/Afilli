# Agent Configurations

This document describes the four specialized autonomous agents available in the affiliate marketing platform.

## Overview

The platform includes four specialized agent types that automate different aspects of the affiliate marketing workflow:

1. **Deal-Finder** - Discovers and scores affiliate offers
2. **Persona-Writer** - Creates customer profiles and optimizes campaigns
3. **List-Builder** - Builds and enriches lead lists
4. **Marketing-Agent** - Creates and launches marketing campaigns

## Agent Types

### 1. Deal-Finder

**Purpose**: Automatically discovers the best performing affiliate offers across multiple platforms, scores them based on conversion potential, and maintains a ranked database.

**Access Requirements**:
- Web scraping capabilities
- Affiliate platform APIs (AWIN, CJ, ClickBank)
- AI/LLM for intelligent scoring

**Configuration Options**:
```json
{
  "minCpsScore": 50,        // Minimum Conversion Potential Score (0-100)
  "maxPersonas": 20,        // Maximum number of personas to generate
  "syncInterval": 21600000  // Sync interval in ms (default: 6 hours)
}
```

**Task Workflow**:
1. **OFFER_SYNC** (every 6 hours)
   - Fetches offers from all configured affiliate platforms
   - Filters by minimum CPS score
   - Upserts to database with deduplication
   
2. **OFFER_SCORING** (between syncs)
   - Re-scores existing offers using AI analysis
   - Considers payout, EPC, cookie window, categories
   - Updates CPS scores and recommendations

**Required Environment Variables**:
- `AWIN_API_TOKEN` - AWIN API authentication token
- `AWIN_PUBLISHER_ID` - Your AWIN publisher ID
- `CJ_API_KEY` - Commission Junction API key
- `CJ_WEBSITE_ID` - Your CJ website ID
- `CLICKBANK_API_KEY` - ClickBank API key
- `OPENROUTER_API_KEY` - For AI-powered scoring

**Metrics Tracked**:
- `offersSynced` - Total offers synchronized
- `tasksCompleted` - Total tasks completed
- `lastSyncAt` - Timestamp of last sync

**Best Practices**:
- Start with a `minCpsScore` of 50 to focus on quality offers
- Run continuously to keep offer database fresh
- Review AI scoring recommendations regularly
- No persona assignment required (works independently)

---

### 2. Persona-Writer

**Purpose**: Builds detailed ideal customer profiles (ICPs) for top-performing products, monitors campaign performance bi-weekly, and automatically switches out underperforming offers.

**Access Requirements**:
- Web scraping for market research
- Social media APIs for audience insights
- AI/LLM for persona generation
- Access to campaign analytics

**Configuration Options**:
```json
{
  "minCpsScore": 60,           // Minimum offer score to build personas for
  "maxPersonas": 20,           // Maximum personas to create
  "monitoringInterval": 1209600000  // Check campaigns every 2 weeks
}
```

**Task Workflow**:
1. **PERSONA_GENERATION** (until 20 personas exist)
   - Identifies top-performing offers (CPS >= 60)
   - Generates detailed customer profiles using AI
   - Creates 200-300 word descriptions
   - Defines 5-7 hypotheses about buyer motivation
   - Identifies 7-10 buying signals with strength ratings
   - Suggests best marketing channels
   - Estimates audience size and CLV
   - Generates search keywords and target sites

2. **CAMPAIGN_MONITORING** (bi-weekly)
   - Analyzes last 14 days of campaign results
   - Calculates CTR, CVR, and revenue metrics
   - Identifies underperforming campaigns (CTR < 2%, CVR < 1%, Revenue < $100)

3. **OFFER_SWITCHING** (after monitoring)
   - For campaigns with CVR < 1% and 50+ clicks
   - Finds better offers in same categories (CPS >= 70)
   - Replaces lowest performing offer

**Required Environment Variables**:
- `OPENROUTER_API_KEY` - For AI-powered persona generation
- `TWITTER_API_KEY`, `TWITTER_API_SECRET` (optional) - For social insights

**Metrics Tracked**:
- `personasCreated` - Total personas generated
- `campaignsOptimized` - Campaigns with offer switches
- `tasksCompleted` - Total tasks completed

**Best Practices**:
- Let it build all 20 personas before focusing on monitoring
- Review generated personas for accuracy
- Adjust `minCpsScore` based on your offer quality
- No persona assignment required (creates personas)

---

### 3. List-Builder

**Purpose**: Uses Clay API to build targeted lists of potential customers based on personas, enriches leads with contact data, and exports to database.

**Access Requirements**:
- Clay API for data enrichment
- Web scraping for lead discovery
- Internal APIs for data storage

**Configuration Options**:
```json
{
  "maxLeadsPerRun": 20,     // Leads to discover per task
  "maxEnrichPerRun": 10     // Leads to enrich per task
}
```

**Task Workflow**:
1. **LEAD_LIST_BUILDING**
   - Uses persona's search keywords and target sites
   - Discovers leads via web scraping
   - Saves to database with "discovered" status
   - Links to assigned persona

2. **LEAD_ENRICHMENT** (alternates with list building)
   - Finds leads missing email, company, or phone data
   - Enriches via Clay API
   - Updates with:
     - Email addresses
     - Phone numbers
     - Company information
     - Job titles and locations
     - Company size and industry
     - Technologies used
     - Social media profiles

**Required Environment Variables**:
- `CLAY_API_KEY` - **REQUIRED** - Clay API authentication key
- `OPENROUTER_API_KEY` - For lead qualification

**Metrics Tracked**:
- `leadsBuilt` - Total leads discovered
- `leadsEnriched` - Total leads enriched with Clay
- `tasksCompleted` - Total tasks completed

**Best Practices**:
- **Must assign to a persona** - List-Builder requires persona context
- Monitor Clay API usage/costs
- Set appropriate `maxEnrichPerRun` to control API costs
- Review enrichment success rate regularly
- Leads are ready for Marketing-Agent after enrichment

---

### 4. Marketing-Agent

**Purpose**: Identifies strong buying signals, creates targeted campaigns, drafts compelling copy, and launches outreach via SendGrid email and optimizes for social media, ChatGPT discovery, and SEO.

**Access Requirements**:
- AI/LLM for content generation
- SendGrid API for email delivery
- Social media APIs (optional)
- Access to event tracking data

**Configuration Options**:
```json
{
  "minOfferScore": 70,          // Minimum CPS for campaign offers
  "maxCampaignsToLaunch": 1,    // Campaigns to launch per task
  "maxLeadsPerCampaign": 50     // Leads to contact per campaign
}
```

**Task Workflow**:
1. **BUYING_SIGNAL_ANALYSIS**
   - Analyzes last 7 days of user events
   - Identifies behavioral patterns indicating purchase intent
   - Groups events by session for pattern detection
   - Generates buying signals with strength ratings:
     - Weak: Low intent
     - Medium: Moderate intent
     - Strong: High intent
     - Very Strong: Imminent purchase
   - Updates persona with signal definitions
   - Provides recommended actions for each signal

2. **CAMPAIGN_CREATION**
   - Selects top 3 offers (CPS >= 70)
   - Generates comprehensive campaign strategy:
     - Compelling campaign name
     - Best channels for persona (email, social, SEO)
     - Realistic goals (clicks, conversions, revenue)
     - 3-5 A/B test email subject lines
     - Detailed HTML email body (personalized)
     - Engaging social media copy
     - SEO keywords for content marketing
   - Creates campaign in "draft" status
   - Generates email creative variations

3. **CAMPAIGN_LAUNCH**
   - Finds draft campaigns ready to launch
   - Retrieves leads with "discovered" status and valid emails
   - Sends personalized emails via SendGrid
   - Updates lead status to "contacted"
   - Activates campaign
   - Tracks email delivery

**Required Environment Variables**:
- `SENDGRID_API_KEY` - **REQUIRED** - For email delivery
- `OPENROUTER_API_KEY` - For AI-powered content generation
- `TWITTER_API_KEY`, `TWITTER_API_SECRET` (optional) - For social posting

**Metrics Tracked**:
- `campaignsCreated` - Total campaigns created
- `campaignsLaunched` - Total campaigns launched
- `emailsSent` - Total emails sent
- `tasksCompleted` - Total tasks completed

**Best Practices**:
- **Must assign to a persona** - Marketing-Agent requires persona context
- Ensure SendGrid is properly configured before launching
- Monitor email delivery rates and engagement
- Review AI-generated copy before large campaigns
- Start with small `maxLeadsPerCampaign` (10-20) for testing
- Combine with List-Builder for best results
- Review buying signals and adjust campaign timing

---

## Agent Scheduling & Orchestration

### Task Creation Logic

Agents automatically create their next task based on:
- Agent type
- Last completed task
- Current system state (e.g., number of personas, leads, campaigns)
- Time since last execution

### Running Agents

Agents can be in one of four states:
- **Idle** - Created but not started
- **Working** - Actively executing tasks
- **Paused** - Temporarily stopped
- **Error** - Encountered an error

To start an agent:
```typescript
// Via UI: Click "Start" button on agent card
// Via API: POST /trpc/agents.start with { id: "agent_id" }
```

### Agent Loop Execution

The agent scheduler (`agent-scheduler.ts`) runs every minute and:
1. Finds all agents with status "working"
2. For each agent:
   - Checks for pending tasks
   - If no pending tasks, creates next task based on agent type
   - Executes the next pending task
   - Updates agent metrics
3. Handles errors gracefully (marks agent as "error" status)

---

## Recommended Agent Workflows

### Workflow 1: Complete Automation
**Goal**: Fully automated affiliate marketing pipeline

1. **Create Deal-Finder** (no persona required)
   - Continuously syncs and scores offers
   - Builds offer database

2. **Create Persona-Writer** (no persona required)
   - Generates 20 detailed personas from top offers
   - Monitors campaigns bi-weekly
   - Switches underperforming offers

3. **For each persona created, create List-Builder** (assign to persona)
   - Builds targeted lead lists
   - Enriches with Clay data

4. **For each persona, create Marketing-Agent** (assign to persona)
   - Analyzes buying signals
   - Creates campaigns
   - Launches email outreach

### Workflow 2: Manual Curation
**Goal**: Agent-assisted with human oversight

1. **Create Deal-Finder**
   - Let it build offer database
   - Manually review and select best offers

2. **Manually create personas** via UI
   - Use Persona-Writer output as inspiration
   - Customize for your specific needs

3. **Create List-Builder per persona**
   - Review enriched leads before outreach

4. **Create Marketing-Agent per persona**
   - Review campaigns in "draft" before launching
   - Manually approve email copy

### Workflow 3: Specialized Agents
**Goal**: Focus on specific tasks

- **Offer Discovery Only**: Just run Deal-Finder
- **Lead Generation Only**: Run List-Builder with pre-created personas
- **Campaign Optimization**: Run Persona-Writer to optimize existing campaigns
- **Outreach Only**: Run Marketing-Agent with manually created campaigns

---

## Environment Variables Summary

### Required for All Agents
- `OPENROUTER_API_KEY` - AI/LLM operations

### Deal-Finder Specific
- `AWIN_API_TOKEN` - AWIN affiliate network
- `AWIN_PUBLISHER_ID` - Your AWIN publisher ID
- `CJ_API_KEY` - Commission Junction
- `CJ_WEBSITE_ID` - Your CJ website ID
- `CLICKBANK_API_KEY` - ClickBank network

### List-Builder Specific
- `CLAY_API_KEY` - **REQUIRED** - Clay data enrichment

### Marketing-Agent Specific
- `SENDGRID_API_KEY` - **REQUIRED** - Email delivery

### Optional (All Agents)
- `TWITTER_API_KEY` - Twitter/X integration
- `TWITTER_API_SECRET` - Twitter/X authentication
- `TWITTER_ACCESS_TOKEN` - Twitter/X access
- `TWITTER_ACCESS_SECRET` - Twitter/X access secret

---

## Monitoring & Metrics

### Agent-Level Metrics
Each agent tracks:
- `tasksCompleted` - Total successful tasks
- `lastRunAt` - Last execution timestamp
- Agent-specific metrics (see each agent type above)

### Task-Level Tracking
Each task has:
- `status` - pending, running, completed, failed
- `input` - Task parameters
- `output` - Task results
- `error` - Error message if failed
- `startedAt`, `completedAt` - Timing

### Viewing Metrics
- **UI**: Agent card shows task count and last run time
- **API**: `GET /trpc/agents.metrics?agentId={id}`

---

## Troubleshooting

### Agent Stuck in "Working" Status
- Check recent tasks for errors
- Review agent logs
- Stop and restart the agent

### Tasks Failing Repeatedly
- Verify required environment variables are set
- Check API credentials are valid
- Review error messages in task output
- Check API rate limits

### No Tasks Being Created
- Ensure agent is in "working" status
- Check if agent type requires persona assignment
- Review createNextTask logic for your agent type

### Poor Quality Results
- Adjust agent configuration (e.g., increase `minCpsScore`)
- Review and improve persona definitions
- Check AI model performance
- Verify data quality from external APIs

---

## Best Practices

1. **Start Small**: Begin with one agent per type to understand behavior
2. **Monitor Closely**: Review agent output regularly, especially initially
3. **Iterate Configurations**: Adjust thresholds based on results
4. **Persona Quality**: High-quality personas lead to better results
5. **API Costs**: Monitor Clay and AI API usage
6. **Email Deliverability**: Warm up SendGrid sender reputation
7. **Data Quality**: Validate enriched lead data before outreach
8. **Campaign Testing**: Start with small lead batches
9. **Regular Reviews**: Check agent metrics weekly
10. **Error Handling**: Address failed tasks promptly

---

## Future Enhancements

Potential improvements:
- Multi-channel outreach (Twitter DM, LinkedIn, etc.)
- Advanced A/B testing automation
- Predictive lead scoring
- Dynamic budget allocation
- Cross-agent collaboration
- Real-time performance optimization
- Automated reporting and insights
