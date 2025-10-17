# AffiliateAI - AI-Native Affiliate Marketing Platform

An autonomous AI-powered affiliate marketing platform that discovers high-converting offers, launches omnichannel campaigns, and continuously optimizes targeting and conversion rates.

## 🚀 Features

### 1. Offer Discovery & Ranking
- **Multi-Network Integration**: CJ Affiliate, Impact, ShareASale, Rakuten, Amazon Associates
- **AI-Powered Scoring**: Conversion Potential Score (CPS) combining EPC, persona relevance, creative quality, and competition
- **Smart Filtering**: Search, filter by source/category, sort by CPS/EPC/payout
- **Real-time Sync**: Automated offer discovery and enrichment

### 2. Persona Management
- **Knowledge Graph**: Links Personas ↔ Offers ↔ Campaigns ↔ Outcomes
- **Hypothesis Tracking**: Bayesian-style updates from campaign results
- **Audience Insights**: Size estimates, CLV, channel preferences
- **Signal Detection**: Keyword and behavior-based targeting

### 3. Campaign Builder
- **Omnichannel**: Email (SendGrid), Social (Twitter, Facebook, Instagram, LinkedIn), Chat
- **AI Creative Generation**: LLM-powered subject lines, captions, and product cards
- **A/B Testing**: Variant management with multi-armed bandit optimization
- **Flight Scheduling**: Cron-based recurring campaigns with audience targeting

### 4. Email Outreach & Tracking
- **Automated Sending**: AI-generated personalized emails sent via SendGrid
- **Delivery Tracking**: Monitor sent, delivered, bounced, and failed emails
- **Engagement Metrics**: Track opens, clicks, and response rates
- **Lead Intelligence**: Automatic lead status updates based on email engagement
- **Webhook Integration**: Real-time event processing for email activity
- **Performance Dashboard**: Aggregate email metrics and individual lead history

### 5. Buying Signal Detection
- **Real-time Tracking**: Page views, product views, scroll depth, time on page, email clicks
- **BuyScore Algorithm**: Weighted scoring (0-100) based on engagement signals
- **Smart Chat Widget**: AI agent surfaces relevant offers when BuyScore ≥ 60
- **Session Intelligence**: Repeat visitor detection and intent classification

### 6. Optimization Engine
- **Feedback Loop**: ETL from all channels (opens, clicks, CTR, CVR, revenue)
- **Persona Updates**: Continuous hypothesis refinement
- **Offer Re-scoring**: Dynamic CPS updates with new evidence
- **Experiment Suggestions**: Thompson sampling for variant selection

## 📋 Prerequisites

- Node.js 18+ and pnpm
- Docker and Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)
- MinIO (via Docker)

## 🛠️ Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd affiliate
pnpm install
```

### 2. Environment Variables

Copy `.env` and configure:

```bash
# Core
NODE_ENV=development
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret

# AI/LLM
OPENROUTER_API_KEY=sk-or-v1-your-key
OPENAI_API_KEY=sk-your-openai-key (optional)

# Email (SendGrid) - See docs/SENDGRID_EMAIL_SETUP.md for detailed setup
SENDGRID_API_KEY=SG.your-sendgrid-key

# Social Media
TWITTER_API_KEY=your-twitter-key
TWITTER_API_SECRET=your-twitter-secret
TWITTER_ACCESS_TOKEN=your-access-token
TWITTER_ACCESS_SECRET=your-access-secret

# Affiliate Networks
CJ_API_KEY=your-cj-api-key
CJ_WEBSITE_ID=your-website-id

# Analytics (PostHog)
POSTHOG_API_KEY=phc_your-key
POSTHOG_HOST=https://app.posthog.com

# Infrastructure
REDIS_URL=redis://redis:6379
```

**📧 Email Setup**: For detailed instructions on setting up SendGrid, including webhook configuration for email tracking, see [docs/SENDGRID_EMAIL_SETUP.md](docs/SENDGRID_EMAIL_SETUP.md)

### 3. Start Services

```bash
# Start all services (Postgres, Redis, MinIO, App)
make dev

# Or manually with docker compose
docker compose -f docker/compose.yaml up -d
```

### 4. Database Setup

```bash
# Push schema to database
make db/push

# Or manually
pnpm db:push

# Seed with demo data
make db/seed

# Or manually
pnpm tsx src/server/scripts/seed.ts
```

### 5. Access the Application

- **App**: http://localhost:8000
- **MinIO Console**: http://localhost:9001 (admin / your_password)
- **Adminer (DB)**: http://localhost:8000/adminer (auto-login configured)

## 📁 Project Structure

```
affiliate/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Layout.tsx       # Main layout with sidebar
│   │   ├── KPICard.tsx      # KPI display cards
│   │   └── StatCard.tsx     # Stat display cards
│   ├── routes/              # TanStack Router pages
│   │   ├── dashboard/       # Dashboard page
│   │   ├── offers/          # Offers listing and detail
│   │   ├── personas/        # Persona management
│   │   ├── campaigns/       # Campaign builder
│   │   ├── experiments/     # A/B test management
│   │   └── settings/        # Integration settings
│   ├── server/
│   │   ├── trpc/
│   │   │   ├── procedures/  # tRPC API endpoints
│   │   │   │   ├── offers.ts
│   │   │   │   ├── personas.ts
│   │   │   │   ├── campaigns.ts
│   │   │   │   ├── events.ts
│   │   │   │   └── chat.ts
│   │   │   └── root.ts      # Router configuration
│   │   ├── scripts/
│   │   │   ├── seed.ts      # Database seeding
│   │   │   └── setup.ts     # Startup logic
│   │   ├── db.ts            # Prisma client
│   │   └── env.ts           # Environment validation
│   └── styles.css           # Global styles
├── prisma/
│   └── schema.prisma        # Database schema
├── docker/
│   ├── compose.yaml         # Docker services
│   └── Dockerfile           # App container
├── Makefile                 # Common tasks
└── README.md
```

## 🎯 Usage

### Dashboard

The main dashboard provides:
- **KPI Cards**: Revenue, CTR, CVR, Active Campaigns
- **Top Offers**: Ranked by CPS with quick access
- **Top Personas**: By campaign count with audience insights
- **Recent Results**: Performance metrics across all channels
- **Quick Actions**: Create campaign, browse offers, manage personas, sync offers

### Offers Page

Discover and manage affiliate offers:
- **Grid/List View**: Toggle between visual grid and detailed list
- **Advanced Filters**: Source, category, min CPS, search
- **Sort Options**: CPS, EPC, payout, recently added
- **Offer Cards**: Image, merchant, CPS score, payout, EPC, cookie window, categories
- **Direct Links**: External link to affiliate offer

### Personas Page

Manage target audience personas:
- **Hypothesis Tracking**: Confidence scores and evidence
- **Signal Configuration**: Keywords and behavior patterns
- **Channel Preferences**: Email, social, chat
- **Audience Metrics**: Size estimates and CLV
- **Campaign History**: Associated campaigns and performance

### Campaigns Page

Create and manage marketing campaigns:
- **Multi-Channel**: Email, Twitter, Facebook, Instagram, LinkedIn, Chat
- **Persona Selection**: Target specific audience segments
- **Offer Selection**: Choose from ranked offers
- **Creative Generation**: AI-powered content creation
- **Flight Scheduling**: Recurring or one-time campaigns
- **Performance Tracking**: Real-time metrics and analytics

### Leads Page

View and manage discovered customer leads:
- **Lead Discovery**: Automatically discovered by AI agents
- **Status Tracking**: Discovered, contacted, responded, converted, unqualified
- **Contact Information**: Email, phone, company, website
- **Interest & Pain Points**: AI-extracted from source content
- **Recommended Offers**: Personalized offer matching
- **Email Tracking**: Detailed history of sent emails with engagement metrics
  - Individual email status (sent, delivered, opened, clicked)
  - Open and click counts with timestamps
  - Aggregate stats (open rate, click rate, total emails)
  - Error tracking for failed sends
- **Outreach History**: Attempts, last contacted date, response tracking

### Settings Page

Configure integrations:
- **Email**: SendGrid API configuration
- **Social Media**: Twitter, Facebook, Instagram, LinkedIn OAuth
- **Affiliate Networks**: CJ, Impact, ShareASale, Rakuten, Amazon credentials
- **Webhooks**: Receive conversion notifications
- **API Keys**: Scoped access tokens

## 🤖 AI Agents

### ResearchAgent
- Queries affiliate platform APIs
- Enriches offer metadata (vertical, EPC, cookie window, creatives)
- Computes Conversion Potential Score (CPS)

### CreativeAgent
- Generates email MJML templates
- Creates social media captions
- Produces chat product cards
- A/B variant generation

### OptimizationAgent
- Consumes campaign results and events
- Updates persona hypotheses
- Re-scores offers with new evidence
- Suggests next experiments (bandit algorithm)

## 📊 Data Models

### Offer
```typescript
{
  id: string
  source: string          // cj, impact, shareasale, etc.
  name: string
  merchant: string
  url: string
  payout: string
  epc: number            // Earnings Per Click
  cookieWindow: number   // days
  geo: string
  categories: string[]
  cps: number           // Conversion Potential Score
  imageUrl: string
  description: string
}
```

### Persona
```typescript
{
  id: string
  name: string
  description: string
  hypotheses: Array<{id, text, confidence}>
  signals: Array<{type, value, weight}>
  channels: string[]
  audienceSizeEst: number
  clvEst: number
  metrics: {avgCtr, avgCvr, avgOrderValue}
}
```

### Campaign
```typescript
{
  id: string
  name: string
  personaId: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  channels: string[]
  goals: {targetCtr, targetCvr, targetRevenue}
  budget: number
  offerIds: string[]
}
```

### Event
```typescript
{
  id: string
  sessionId: string
  type: 'page_view' | 'product_view' | 'email_click' | etc.
  payload: object
  ts: Date
}
```

### SentEmail
```typescript
{
  id: number
  leadId: string
  sendgridId: string       // SendGrid message ID for tracking
  subject: string
  body: string
  status: string           // pending, sent, delivered, opened, clicked, bounced, failed
  sentAt: Date
  deliveredAt: Date
  openedAt: Date
  firstOpenedAt: Date
  clickedAt: Date
  firstClickedAt: Date
  bouncedAt: Date
  openCount: number
  clickCount: number
  errorMessage: string
  metadata: object
}
```

## 🔧 API Endpoints

### Offers
- `offers.list({limit, offset, source?, category?, minCps?, search?, sortBy, sortOrder})`
- `offers.get({id})`
- `offers.rank({personaId?, limit})`
- `offers.sync({source, since?})`
- `offers.stats()`

### Personas
- `personas.list()`
- `personas.get({id})`
- `personas.create({name, description, hypotheses, signals, channels, ...})`
- `personas.update({id, ...})`
- `personas.suggest({offerId})`

### Campaigns
- `campaigns.list({status?, personaId?})`
- `campaigns.get({id})`
- `campaigns.create({name, personaId, channels, offerIds, goals?, budget?})`
- `campaigns.update({id, ...})`
- `campaigns.analytics({id})`
- `campaigns.dashboardStats()`

### Events
- `events.ingest({sessionId, type, payload, userId?})`
- `events.getSession({sessionId})`
- `events.computeBuyScore({sessionId})`

### Chat
- `chat.history({sessionId})`
- `chat.send({sessionId, content})`
- `chat.recommend({sessionId})`

### Emails
- `emails.listLeadEmails({leadId, limit?, offset?})`
- `emails.getStats({leadId})`
- `emails.globalStats({personaId?, days?})`
- `emails.handleWebhook([events])`

### Webhooks
- `webhooks.sendgrid([events])` - SendGrid event webhook endpoint

## 🔗 Webhook Configuration

### SendGrid Event Webhooks

The application receives real-time email events from SendGrid via webhooks:

**Webhook URL**: `https://your-domain.com/trpc/webhooks.sendgrid`

**Tracked Events**:
- Delivered: Email successfully delivered to recipient
- Opened: Recipient opened the email
- Clicked: Recipient clicked a link in the email
- Bounced: Email bounced (hard or soft bounce)
- Dropped: Email dropped by SendGrid
- Spam Report: Recipient marked email as spam

**Setup Instructions**: See [docs/SENDGRID_EMAIL_SETUP.md](docs/SENDGRID_EMAIL_SETUP.md) for complete webhook configuration.

**Local Testing**: Use ngrok to expose your local server for webhook testing during development.

## 🧪 Testing

```bash
# Run linter
make lint

# Run tests (when implemented)
make test

# Type checking
pnpm typecheck
```

## 🚀 Deployment

### Production Build

```bash
# Build for production
pnpm build

# Start production server
NODE_ENV=production make start
```

### Environment Variables (Production)

**Critical - Must Change:**
- `JWT_SECRET`: Generate a secure random string
- `ADMIN_PASSWORD`: Strong password for admin access
- `OPENROUTER_API_KEY` or `OPENAI_API_KEY`: Valid API key for LLM features

**Required for Full Functionality:**
- `SENDGRID_API_KEY`: For email campaigns
- `CJ_API_KEY` & `CJ_WEBSITE_ID`: For CJ Affiliate integration
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`: For Twitter posting

**Optional:**
- `POSTHOG_API_KEY`: For analytics (recommended)
- Other social media API keys as needed

## 🔒 Security

- **Input Validation**: Zod schemas on all tRPC procedures
- **Environment Variables**: All secrets in `.env`, validated with Zod
- **Rate Limiting**: Implemented at nginx level
- **Scoped API Keys**: Per-integration credentials
- **PII Minimization**: Only essential user data stored
- **OWASP Basics**: XSS protection, CSRF tokens, secure headers

## 📈 Observability

- **Structured Logs**: JSON logging with request IDs
- **Health Endpoints**: `/health` for monitoring
- **PostHog Events**: User actions, conversions, errors
- **Performance Metrics**: Query times, cache hit rates

## 🎨 Design System

- **Colors**: Primary (blue), Success (green), Warning (orange), Danger (red)
- **Typography**: Inter font family
- **Components**: Tailwind CSS with custom utilities
- **Dark Mode**: Full support with class-based toggling
- **Icons**: Lucide React
- **Responsive**: Mobile-first design

## 📝 Demo Data

The seed script creates:
- **3 Personas**: Frugal Founders, Home Gym Builders, Solo Travelers
- **20 Offers**: Mix of SaaS, fitness, travel, and general products
- **2 Campaigns**: Q1 Productivity Tools, Home Gym Equipment Promo
- **Sample Events**: Page views, product views, email clicks, chat interactions
- **Results**: Performance metrics across email and social channels

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `make lint` and fix any issues
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🆘 Support

For issues and questions:
- GitHub Issues: [repository-url]/issues
- Email: support@affiliateai.example.com
- Documentation: [docs-url]

## 🗺️ Roadmap

**✅ Completed:**
- [x] SendGrid email sending integration
- [x] Email tracking (opens, clicks, bounces)
- [x] Webhook event processing
- [x] Lead-level email analytics
- [x] Dashboard email metrics
- [x] Automated outreach via AI agents

**🚧 In Progress:**
- [ ] Real CJ Affiliate API integration
- [ ] Twitter posting via API
- [ ] Real-time chat widget embedding
- [ ] Thompson sampling for A/B tests
- [ ] LLM-powered creative generation improvements

**📋 Planned:**
- [ ] Playwright-based offer scraping
- [ ] BullMQ job queue for agents
- [ ] PostHog event tracking
- [ ] E2E tests with Playwright
- [ ] GraphQL API option
- [ ] Mobile app (React Native)
- [ ] Email template builder
- [ ] Unsubscribe management
- [ ] Email warmup sequences
- [ ] Multi-language support

---

Built with ❤️ using Next.js, TypeScript, Prisma, tRPC, and Tailwind CSS
