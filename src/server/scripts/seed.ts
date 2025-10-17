import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function seed() {
  console.log("🌱 Seeding database...");

  // Clear existing data
  await prisma.chatMessage.deleteMany();
  await prisma.result.deleteMany();
  await prisma.event.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.creative.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.persona.deleteMany();
  await prisma.integration.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email: "demo@affiliate.ai",
      orgId: "org_demo",
      role: "admin",
    },
  });

  console.log("✅ Created demo user");

  // Create 3 personas
  const personas = await Promise.all([
    prisma.persona.create({
      data: {
        name: "Frugal Founders",
        description: "Budget-conscious startup founders looking for cost-effective tools and services",
        hypotheses: [
          { id: 1, text: "Prefer annual plans with discounts", confidence: 0.75 },
          { id: 2, text: "Value ROI calculators and case studies", confidence: 0.82 },
          { id: 3, text: "Active on Twitter and LinkedIn", confidence: 0.88 },
        ],
        signals: [
          { type: "keyword", value: "startup discount", weight: 1.2 },
          { type: "keyword", value: "bootstrap", weight: 1.0 },
          { type: "behavior", value: "price_comparison", weight: 1.5 },
        ],
        channels: ["email", "twitter", "linkedin"],
        audienceSizeEst: 45000,
        clvEst: 1250.0,
        metrics: {
          avgCtr: 0.045,
          avgCvr: 0.028,
          avgOrderValue: 450,
        },
      },
    }),
    prisma.persona.create({
      data: {
        name: "Home Gym Builders",
        description: "Fitness enthusiasts building home workout spaces",
        hypotheses: [
          { id: 1, text: "Research extensively before purchase", confidence: 0.85 },
          { id: 2, text: "Value video content and demos", confidence: 0.79 },
          { id: 3, text: "Influenced by fitness influencers", confidence: 0.91 },
        ],
        signals: [
          { type: "keyword", value: "home gym", weight: 1.5 },
          { type: "keyword", value: "workout equipment", weight: 1.3 },
          { type: "behavior", value: "video_watch", weight: 1.4 },
        ],
        channels: ["email", "instagram", "youtube"],
        audienceSizeEst: 120000,
        clvEst: 850.0,
        metrics: {
          avgCtr: 0.062,
          avgCvr: 0.035,
          avgOrderValue: 320,
        },
      },
    }),
    prisma.persona.create({
      data: {
        name: "Solo Travelers",
        description: "Independent travelers seeking experiences and travel gear",
        hypotheses: [
          { id: 1, text: "Book trips 2-3 months in advance", confidence: 0.73 },
          { id: 2, text: "Prefer authentic experiences over luxury", confidence: 0.86 },
          { id: 3, text: "Active on Instagram and travel blogs", confidence: 0.89 },
        ],
        signals: [
          { type: "keyword", value: "solo travel", weight: 1.4 },
          { type: "keyword", value: "backpack", weight: 1.1 },
          { type: "behavior", value: "destination_research", weight: 1.3 },
        ],
        channels: ["email", "instagram", "facebook"],
        audienceSizeEst: 85000,
        clvEst: 680.0,
        metrics: {
          avgCtr: 0.055,
          avgCvr: 0.031,
          avgOrderValue: 275,
        },
      },
    }),
  ]);

  console.log("✅ Created 3 personas");

  // Create 20 offers from various sources
  const offers = await Promise.all([
    // SaaS & Tools (for Frugal Founders)
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_123456",
        name: "Notion Pro - 50% Off Annual Plan",
        merchant: "Notion",
        url: "https://notion.so/affiliate",
        payout: "$50 per signup",
        epc: 125.5,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Productivity", "SaaS"],
        cps: 92.5,
        imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800",
        description: "All-in-one workspace for notes, docs, and collaboration",
        meta: {
          commission: "50%",
          averageOrderValue: 100,
          conversionRate: 0.045,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_impact_789012",
        name: "Figma Professional",
        merchant: "Figma",
        url: "https://figma.com/affiliate",
        payout: "$30 per conversion",
        epc: 98.2,
        cookieWindow: 45,
        geo: "Global",
        categories: ["Design", "SaaS"],
        cps: 88.3,
        imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800",
        description: "Collaborative interface design tool",
        meta: {
          commission: "30%",
          averageOrderValue: 144,
          conversionRate: 0.038,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_345678",
        name: "Slack Business+ Plan",
        merchant: "Slack",
        url: "https://slack.com/affiliate",
        payout: "$75 per team signup",
        epc: 142.8,
        cookieWindow: 60,
        geo: "Global",
        categories: ["Communication", "SaaS"],
        cps: 91.7,
        imageUrl: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800",
        description: "Team communication and collaboration platform",
        meta: {
          commission: "Fixed",
          averageOrderValue: 200,
          conversionRate: 0.042,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_shareasale_567890",
        name: "Mailchimp Premium",
        merchant: "Mailchimp",
        url: "https://mailchimp.com/affiliate",
        payout: "20% recurring",
        epc: 87.4,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Marketing", "Email"],
        cps: 85.2,
        imageUrl: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800",
        description: "Email marketing and automation platform",
        meta: {
          commission: "20%",
          averageOrderValue: 299,
          conversionRate: 0.035,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_901234",
        name: "Canva Pro Annual",
        merchant: "Canva",
        url: "https://canva.com/affiliate",
        payout: "$36 per annual signup",
        epc: 95.6,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Design", "Marketing"],
        cps: 87.9,
        imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800",
        description: "Easy-to-use graphic design platform",
        meta: {
          commission: "30%",
          averageOrderValue: 120,
          conversionRate: 0.041,
          isDemo: true,
        },
      },
    }),

    // Fitness Equipment (for Home Gym Builders)
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_111222",
        name: "Bowflex SelectTech Dumbbells",
        merchant: "Bowflex",
        url: "https://bowflex.com/affiliate",
        payout: "8% commission",
        epc: 156.3,
        cookieWindow: 45,
        geo: "US, CA, UK",
        categories: ["Fitness", "Equipment"],
        cps: 94.2,
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800",
        description: "Adjustable dumbbells for home workouts",
        meta: {
          commission: "8%",
          averageOrderValue: 549,
          conversionRate: 0.052,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_impact_333444",
        name: "Peloton Bike+ Package",
        merchant: "Peloton",
        url: "https://peloton.com/affiliate",
        payout: "$100 per bike sale",
        epc: 245.7,
        cookieWindow: 30,
        geo: "US, UK, CA, DE",
        categories: ["Fitness", "Equipment"],
        cps: 96.8,
        imageUrl: "https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800",
        description: "Interactive fitness bike with live classes",
        meta: {
          commission: "Fixed",
          averageOrderValue: 2495,
          conversionRate: 0.038,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_shareasale_555666",
        name: "TRX Home2 System",
        merchant: "TRX",
        url: "https://trxtraining.com/affiliate",
        payout: "10% commission",
        epc: 89.2,
        cookieWindow: 60,
        geo: "Global",
        categories: ["Fitness", "Equipment"],
        cps: 86.5,
        imageUrl: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800",
        description: "Suspension training system for full-body workouts",
        meta: {
          commission: "10%",
          averageOrderValue: 169,
          conversionRate: 0.048,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_777888",
        name: "Rogue Fitness Power Rack",
        merchant: "Rogue Fitness",
        url: "https://roguefitness.com/affiliate",
        payout: "5% commission",
        epc: 178.4,
        cookieWindow: 45,
        geo: "US, CA",
        categories: ["Fitness", "Equipment"],
        cps: 91.3,
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800",
        description: "Professional-grade power rack for home gyms",
        meta: {
          commission: "5%",
          averageOrderValue: 895,
          conversionRate: 0.044,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_impact_999000",
        name: "MyProtein Supplements Bundle",
        merchant: "MyProtein",
        url: "https://myprotein.com/affiliate",
        payout: "12% commission",
        epc: 67.8,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Fitness", "Nutrition"],
        cps: 82.1,
        imageUrl: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800",
        description: "Premium sports nutrition and supplements",
        meta: {
          commission: "12%",
          averageOrderValue: 85,
          conversionRate: 0.055,
          isDemo: true,
        },
      },
    }),

    // Travel & Gear (for Solo Travelers)
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_121212",
        name: "Booking.com Hotels",
        merchant: "Booking.com",
        url: "https://booking.com/affiliate",
        payout: "25% commission",
        epc: 198.5,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Travel", "Accommodation"],
        cps: 95.7,
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800",
        description: "Book hotels, apartments, and unique stays worldwide",
        meta: {
          commission: "25%",
          averageOrderValue: 450,
          conversionRate: 0.062,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_impact_343434",
        name: "Airbnb Experiences",
        merchant: "Airbnb",
        url: "https://airbnb.com/affiliate",
        payout: "$15 per booking",
        epc: 156.2,
        cookieWindow: 45,
        geo: "Global",
        categories: ["Travel", "Experiences"],
        cps: 93.4,
        imageUrl: "https://images.unsplash.com/photo-1503220317375-aaad61436b1b?w=800",
        description: "Unique travel experiences hosted by locals",
        meta: {
          commission: "Fixed",
          averageOrderValue: 120,
          conversionRate: 0.058,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_shareasale_565656",
        name: "Osprey Backpacks",
        merchant: "Osprey",
        url: "https://osprey.com/affiliate",
        payout: "8% commission",
        epc: 92.7,
        cookieWindow: 60,
        geo: "Global",
        categories: ["Travel", "Gear"],
        cps: 88.9,
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
        description: "Premium travel and hiking backpacks",
        meta: {
          commission: "8%",
          averageOrderValue: 185,
          conversionRate: 0.051,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_787878",
        name: "Skyscanner Flight Search",
        merchant: "Skyscanner",
        url: "https://skyscanner.com/affiliate",
        payout: "$0.50 per click",
        epc: 45.3,
        cookieWindow: 7,
        geo: "Global",
        categories: ["Travel", "Flights"],
        cps: 79.2,
        imageUrl: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800",
        description: "Compare flight prices across airlines",
        meta: {
          commission: "CPC",
          averageOrderValue: 0,
          conversionRate: 0.125,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_impact_909090",
        name: "Lonely Planet Guides",
        merchant: "Lonely Planet",
        url: "https://lonelyplanet.com/affiliate",
        payout: "10% commission",
        epc: 38.9,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Travel", "Books"],
        cps: 76.5,
        imageUrl: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800",
        description: "Comprehensive travel guidebooks and resources",
        meta: {
          commission: "10%",
          averageOrderValue: 28,
          conversionRate: 0.072,
          isDemo: true,
        },
      },
    }),

    // Additional cross-category offers
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_010101",
        name: "NordVPN Premium",
        merchant: "NordVPN",
        url: "https://nordvpn.com/affiliate",
        payout: "30% commission",
        epc: 134.6,
        cookieWindow: 30,
        geo: "Global",
        categories: ["Security", "Software"],
        cps: 90.8,
        imageUrl: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=800",
        description: "Secure VPN service for privacy and security",
        meta: {
          commission: "30%",
          averageOrderValue: 143,
          conversionRate: 0.047,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_shareasale_020202",
        name: "Grammarly Premium",
        merchant: "Grammarly",
        url: "https://grammarly.com/affiliate",
        payout: "$20 per signup",
        epc: 112.4,
        cookieWindow: 90,
        geo: "Global",
        categories: ["Productivity", "Writing"],
        cps: 89.6,
        imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800",
        description: "AI-powered writing assistant",
        meta: {
          commission: "Fixed",
          averageOrderValue: 144,
          conversionRate: 0.043,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_impact_030303",
        name: "Audible Premium Plus",
        merchant: "Audible",
        url: "https://audible.com/affiliate",
        payout: "$15 per trial",
        epc: 89.3,
        cookieWindow: 30,
        geo: "US, UK, CA, AU",
        categories: ["Entertainment", "Books"],
        cps: 85.7,
        imageUrl: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800",
        description: "Audiobook subscription service",
        meta: {
          commission: "Fixed",
          averageOrderValue: 14.95,
          conversionRate: 0.068,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_awin_040404",
        name: "Shopify Plus",
        merchant: "Shopify",
        url: "https://shopify.com/affiliate",
        payout: "200% of first month",
        epc: 167.8,
        cookieWindow: 30,
        geo: "Global",
        categories: ["E-commerce", "SaaS"],
        cps: 92.3,
        imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800",
        description: "Complete e-commerce platform",
        meta: {
          commission: "200%",
          averageOrderValue: 79,
          conversionRate: 0.039,
          isDemo: true,
        },
      },
    }),
    prisma.offer.create({
      data: {
        source: "demo",
        sourceId: "demo_shareasale_050505",
        name: "REI Co-op Membership",
        merchant: "REI",
        url: "https://rei.com/affiliate",
        payout: "5% commission",
        epc: 78.4,
        cookieWindow: 15,
        geo: "US",
        categories: ["Outdoor", "Retail"],
        cps: 83.2,
        imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=800",
        description: "Outdoor gear and apparel retailer",
        meta: {
          commission: "5%",
          averageOrderValue: 156,
          conversionRate: 0.046,
          isDemo: true,
        },
      },
    }),
  ]);

  console.log("✅ Created 20 offers");

  // Create 2 example campaigns with creatives
  const campaign1 = await prisma.campaign.create({
    data: {
      name: "Q1 Productivity Tools Campaign",
      personaId: personas[0].id,
      status: "active",
      channels: ["email", "twitter", "linkedin"],
      goals: {
        targetCtr: 0.05,
        targetCvr: 0.03,
        targetRevenue: 5000,
      },
      budget: 2500,
      offerIds: [offers[0].id, offers[1].id, offers[2].id],
    },
  });

  await Promise.all([
    prisma.creative.create({
      data: {
        campaignId: campaign1.id,
        channel: "email",
        subject: "🚀 50% off Notion Pro - Build Your Startup Stack",
        body: `Hey there, founder!

We know every dollar counts when you're building something from scratch. That's why we're excited to share this exclusive offer: Get 50% off Notion Pro's annual plan.

Notion brings together your notes, docs, wikis, and projects in one place. No more context switching between a dozen tools.

What you get:
✓ Unlimited blocks for you and your team
✓ Unlimited file uploads
✓ 30-day version history
✓ Advanced permissions

Claim your 50% discount →

This offer won't last long. Start building your all-in-one workspace today.

Cheers,
The Affiliate Team`,
        ctaUrl: offers[0].url,
        utm: {
          source: "email",
          medium: "campaign",
          campaign: "q1_productivity",
        },
        variant: "a",
      },
    }),
    prisma.creative.create({
      data: {
        campaignId: campaign1.id,
        channel: "email",
        subject: "💰 Your startup deserves better tools (at better prices)",
        body: `Hi founder,

Quick question: How much time do you waste switching between tools?

If it's more than 10 minutes a day, you need Notion Pro. And right now, you can get it for 50% off.

One workspace for:
• Product roadmaps
• Meeting notes
• Wiki & docs
• Project management

No more tool sprawl. No more wasted time.

Get 50% off Notion Pro →

Limited time offer for bootstrapped founders.

Best,
The Affiliate Team`,
        ctaUrl: offers[0].url,
        utm: {
          source: "email",
          medium: "campaign",
          campaign: "q1_productivity",
        },
        variant: "b",
      },
    }),
    prisma.creative.create({
      data: {
        campaignId: campaign1.id,
        channel: "twitter",
        subject: null,
        body: `🚀 Bootstrapped founders: Stop paying full price for tools.

Get 50% off @NotionHQ Pro and consolidate your entire stack into one workspace.

Perfect for:
→ Product docs
→ Team wiki
→ Project management
→ Meeting notes

Claim your discount 👇
[LINK]

#StartupTools #Productivity`,
        ctaUrl: offers[0].url,
        utm: {
          source: "twitter",
          medium: "social",
          campaign: "q1_productivity",
        },
        variant: "a",
      },
    }),
  ]);

  const campaign2 = await prisma.campaign.create({
    data: {
      name: "Home Gym Equipment Promo",
      personaId: personas[1].id,
      status: "active",
      channels: ["email", "instagram"],
      goals: {
        targetCtr: 0.06,
        targetCvr: 0.04,
        targetRevenue: 8000,
      },
      budget: 3500,
      offerIds: [offers[5].id, offers[6].id, offers[7].id],
    },
  });

  await Promise.all([
    prisma.creative.create({
      data: {
        campaignId: campaign2.id,
        channel: "email",
        subject: "💪 Build Your Dream Home Gym (Without Breaking the Bank)",
        body: `Hey fitness enthusiast!

No more excuses. No more crowded gyms. Build your perfect home workout space with premium equipment at unbeatable prices.

🏋️ Bowflex SelectTech Dumbbells
Adjustable from 5-52.5 lbs. Save space. Save money.
→ Get 8% cash back

🚴 Peloton Bike+
Live classes. Leaderboards. Results.
→ Earn $100 per purchase

🎯 TRX Home2 System
Full-body workouts. Minimal space required.
→ Get 10% cash back

Start building your home gym today →

Your future self will thank you.

Stay strong,
The Fitness Affiliate Team`,
        ctaUrl: offers[5].url,
        utm: {
          source: "email",
          medium: "campaign",
          campaign: "home_gym_q1",
        },
        variant: "a",
      },
    }),
    prisma.creative.create({
      data: {
        campaignId: campaign2.id,
        channel: "instagram",
        subject: null,
        body: `Transform any room into your personal fitness studio 💪

Swipe to see our top picks for home gym essentials:

1️⃣ Bowflex SelectTech - Adjustable dumbbells that save space
2️⃣ Peloton Bike+ - Live classes from world-class instructors  
3️⃣ TRX System - Full-body workouts anywhere

No commute. No crowds. Just results.

Tap the link in bio to start building your dream home gym 🏋️‍♀️

#HomeGym #FitnessMotivation #WorkoutFromHome #GymEquipment #FitnessGoals`,
        ctaUrl: offers[5].url,
        utm: {
          source: "instagram",
          medium: "social",
          campaign: "home_gym_q1",
        },
        variant: "a",
      },
    }),
  ]);

  console.log("✅ Created 2 campaigns with creatives");

  // Create flights for campaigns
  await Promise.all([
    prisma.flight.create({
      data: {
        campaignId: campaign1.id,
        schedule: {
          type: "recurring",
          cron: "0 9 * * 1,3,5",
          timezone: "America/New_York",
        },
        audience: {
          segments: ["founders", "early_stage"],
          excludeConverted: true,
        },
        status: "running",
      },
    }),
    prisma.flight.create({
      data: {
        campaignId: campaign2.id,
        schedule: {
          type: "recurring",
          cron: "0 10 * * 2,4,6",
          timezone: "America/Los_Angeles",
        },
        audience: {
          segments: ["fitness_enthusiasts", "home_workout"],
          excludeConverted: true,
        },
        status: "running",
      },
    }),
  ]);

  console.log("✅ Created flight schedules");

  // Create sample events
  const sessionId = "sess_demo_12345";
  await Promise.all([
    prisma.event.create({
      data: {
        sessionId,
        type: "page_view",
        payload: { page: "/offers", referrer: "google" },
      },
    }),
    prisma.event.create({
      data: {
        sessionId,
        type: "product_view",
        payload: { offerId: offers[0].id, duration: 45 },
      },
    }),
    prisma.event.create({
      data: {
        sessionId,
        type: "scroll_depth",
        payload: { depth: 85 },
      },
    }),
    prisma.event.create({
      data: {
        sessionId,
        type: "email_click",
        payload: { campaignId: campaign1.id, linkUrl: offers[0].url },
      },
    }),
    prisma.event.create({
      data: {
        sessionId,
        type: "chat_open",
        payload: { source: "widget" },
      },
    }),
  ]);

  console.log("✅ Created sample events");

  // Create sample results
  await Promise.all([
    prisma.result.create({
      data: {
        campaignId: campaign1.id,
        channel: "email",
        metrics: {
          sent: 1000,
          delivered: 985,
          opens: 442,
          clicks: 89,
          conversions: 12,
          ctr: 0.0904,
          cvr: 0.1348,
          revenue: 1245.50,
        },
      },
    }),
    prisma.result.create({
      data: {
        campaignId: campaign1.id,
        channel: "twitter",
        metrics: {
          impressions: 15420,
          engagements: 892,
          clicks: 234,
          conversions: 8,
          ctr: 0.0152,
          cvr: 0.0342,
          revenue: 780.00,
        },
      },
    }),
    prisma.result.create({
      data: {
        campaignId: campaign2.id,
        channel: "email",
        metrics: {
          sent: 850,
          delivered: 835,
          opens: 518,
          clicks: 124,
          conversions: 18,
          ctr: 0.1485,
          cvr: 0.1452,
          revenue: 2890.50,
        },
      },
    }),
  ]);

  console.log("✅ Created sample results");

  // Create sample chat messages
  await Promise.all([
    prisma.chatMessage.create({
      data: {
        sessionId,
        role: "user",
        content: "I'm looking for tools to help me manage my startup better",
      },
    }),
    prisma.chatMessage.create({
      data: {
        sessionId,
        role: "assistant",
        content: "I'd be happy to help! Based on your needs, I have some great recommendations for productivity and collaboration tools.",
        offers: [
          { id: offers[0].id, name: offers[0].name, reason: "All-in-one workspace perfect for startups" },
          { id: offers[2].id, name: offers[2].name, reason: "Team communication platform" },
        ],
        buyScore: 75,
      },
    }),
  ]);

  console.log("✅ Created sample chat messages");

  // Create integration stubs
  await Promise.all([
    prisma.integration.create({
      data: {
        type: "email",
        provider: "sendgrid",
        credentials: { apiKey: "encrypted_placeholder" },
        config: { fromEmail: "noreply@affiliate.ai", fromName: "Affiliate Platform" },
        status: "pending",
      },
    }),
    prisma.integration.create({
      data: {
        type: "social",
        provider: "twitter",
        credentials: { apiKey: "encrypted_placeholder" },
        config: { handle: "@affiliateai" },
        status: "pending",
      },
    }),
    prisma.integration.create({
      data: {
        type: "affiliate",
        provider: "awin",
        credentials: { apiKey: "encrypted_placeholder" },
        config: { publisherId: "placeholder" },
        status: "pending",
      },
    }),
  ]);

  console.log("✅ Created integration stubs");

  console.log("🎉 Seed complete!");
}

seed()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
