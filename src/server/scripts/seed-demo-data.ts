/**
 * Seed script to populate the database with demo data
 * Run with: pnpm tsx src/server/scripts/seed-demo-data.ts
 */

import { db } from "../db";

async function main() {
  console.log("🌱 Seeding demo data...");

  // Create a demo persona
  const persona = await db.persona.upsert({
    where: { id: "demo-persona-1" },
    update: {},
    create: {
      id: "demo-persona-1",
      name: "Health & Fitness Enthusiasts",
      description:
        "Active individuals aged 25-45 interested in fitness, nutrition, and wellness products",
      hypotheses: [
        "Responds well to social proof and transformations",
        "Prefers subscription-based products",
        "Engages with video content",
      ],
      signals: [
        { type: "keyword", value: "fitness", weight: 0.9 },
        { type: "keyword", value: "health", weight: 0.8 },
        { type: "keyword", value: "nutrition", weight: 0.7 },
        { type: "keyword", value: "wellness", weight: 0.7 },
      ],
      channels: ["email", "social", "content"],
      audienceSizeEst: 50000,
      clvEst: 250.0,
      metrics: {
        avgEngagement: 0.042,
        conversionRate: 0.018,
        totalReach: 50000,
      },
      searchKeywords: [
        "best workout supplements",
        "weight loss programs",
        "fitness apps",
        "healthy meal plans",
      ],
      targetSites: [
        "bodybuilding.com",
        "myfitnesspal.com",
        "reddit.com/r/fitness",
      ],
    },
  });

  console.log("✅ Created persona:", persona.name);

  // Create demo offers
  const offers = await Promise.all([
    db.offer.upsert({
      where: { id: "demo-offer-1" },
      update: {},
      create: {
        id: "demo-offer-1",
        source: "demo",
        sourceId: "offer-1",
        name: "Premium Protein Powder - 30% Commission",
        merchant: "FitNutrition Pro",
        url: "https://example.com/protein-powder",
        payout: "$25.00",
        epc: 2.85,
        cookieWindow: 30,
        geo: "US, CA, UK",
        categories: ["Health & Fitness", "Nutrition", "Supplements"],
        cps: 78.5,
        imageUrl:
          "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400",
        description:
          "High-quality whey protein powder with 25g protein per serving. Popular with fitness enthusiasts.",
        meta: {
          rating: 4.7,
          reviews: 1250,
          commissionType: "percentage",
          conversionRate: 0.045,
        },
      },
    }),
    db.offer.upsert({
      where: { id: "demo-offer-2" },
      update: {},
      create: {
        id: "demo-offer-2",
        source: "demo",
        sourceId: "offer-2",
        name: "AI Workout App - Recurring $15/month",
        merchant: "FitAI Coach",
        url: "https://example.com/workout-app",
        payout: "$15.00/month",
        epc: 3.2,
        cookieWindow: 60,
        geo: "US, CA, UK, AU",
        categories: ["Health & Fitness", "Apps", "Subscription"],
        cps: 82.3,
        imageUrl:
          "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400",
        description:
          "AI-powered personalized workout plans. Recurring monthly commission.",
        meta: {
          rating: 4.9,
          reviews: 3420,
          commissionType: "recurring",
          conversionRate: 0.058,
          recurringMonths: 8.5,
        },
      },
    }),
    db.offer.upsert({
      where: { id: "demo-offer-3" },
      update: {},
      create: {
        id: "demo-offer-3",
        source: "demo",
        sourceId: "offer-3",
        name: "Meal Prep Delivery Service",
        merchant: "HealthyMeals Co",
        url: "https://example.com/meal-prep",
        payout: "$35.00",
        epc: 4.1,
        cookieWindow: 45,
        geo: "US",
        categories: ["Health & Fitness", "Food", "Subscription"],
        cps: 89.2,
        imageUrl:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
        description:
          "Fresh, healthy meal prep delivered weekly. High conversion rates.",
        meta: {
          rating: 4.8,
          reviews: 890,
          commissionType: "percentage",
          conversionRate: 0.062,
        },
      },
    }),
    db.offer.upsert({
      where: { id: "demo-offer-4" },
      update: {},
      create: {
        id: "demo-offer-4",
        source: "demo",
        sourceId: "offer-4",
        name: "Smart Fitness Tracker Watch",
        merchant: "TechFit",
        url: "https://example.com/fitness-watch",
        payout: "$45.00",
        epc: 5.5,
        cookieWindow: 30,
        geo: "US, CA, UK, AU, EU",
        categories: ["Health & Fitness", "Technology", "Wearables"],
        cps: 91.5,
        imageUrl:
          "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400",
        description:
          "Advanced fitness tracker with heart rate, sleep tracking, and GPS.",
        meta: {
          rating: 4.6,
          reviews: 2150,
          commissionType: "fixed",
          conversionRate: 0.038,
        },
      },
    }),
    db.offer.upsert({
      where: { id: "demo-offer-5" },
      update: {},
      create: {
        id: "demo-offer-5",
        source: "demo",
        sourceId: "offer-5",
        name: "Online Yoga Classes Membership",
        merchant: "ZenYoga Studio",
        url: "https://example.com/yoga-classes",
        payout: "$20.00/month",
        epc: 2.9,
        cookieWindow: 60,
        geo: "US, CA, UK, AU",
        categories: ["Health & Fitness", "Wellness", "Subscription"],
        cps: 75.8,
        imageUrl:
          "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400",
        description:
          "Unlimited access to live and on-demand yoga classes. Beginner friendly.",
        meta: {
          rating: 4.9,
          reviews: 1580,
          commissionType: "recurring",
          conversionRate: 0.051,
          recurringMonths: 6.2,
        },
      },
    }),
  ]);

  console.log(`✅ Created ${offers.length} offers`);

  // Create a demo agent
  const agent = await db.agent.upsert({
    where: { id: "demo-agent-1" },
    update: {},
    create: {
      id: "demo-agent-1",
      name: "Fitness Deal Finder",
      type: "DEAL_FINDER",
      status: "working",
      personaId: persona.id,
      config: {
        sources: ["awin", "cj", "clickbank"],
        minCps: 70,
        categories: ["Health & Fitness", "Nutrition", "Wellness"],
        autoSync: true,
        syncInterval: 6,
      },
      currentTask: "OFFER_SYNC",
      lastRunAt: new Date(),
      metrics: {
        offersFound: 127,
        offersAdded: 43,
        avgCps: 82.5,
        lastSyncDuration: 145,
        successRate: 0.96,
      },
    },
  });

  console.log("✅ Created agent:", agent.name);

  // Create demo campaign
  const campaign = await db.campaign.upsert({
    where: { id: "demo-campaign-1" },
    update: {},
    create: {
      id: "demo-campaign-1",
      name: "Q4 Fitness Product Launch",
      personaId: persona.id,
      status: "active",
      channels: ["email", "social", "content"],
      goals: {
        revenue: 50000,
        conversions: 500,
        reach: 100000,
      },
      budget: 10000,
      offerIds: offers.map((o) => o.id),
    },
  });

  console.log("✅ Created campaign:", campaign.name);

  // Create some demo leads
  const leads = await Promise.all([
    db.customerLead.upsert({
      where: { id: "demo-lead-1" },
      update: {},
      create: {
        id: "demo-lead-1",
        email: "john.fitness@example.com",
        name: "John Doe",
        outreachStatus: "contacted",
        personaId: persona.id,
        sourceUrl: "https://fitness-forums.com/thread-123",
        discoveredVia: "web_search",
        interests: ["weight-training", "supplements", "meal-prep"],
        painPoints: ["losing motivation", "finding time"],
        metadata: {
          engagementLevel: "high",
          lastActivity: new Date().toISOString(),
          score: 85,
        },
      },
    }),
    db.customerLead.upsert({
      where: { id: "demo-lead-2" },
      update: {},
      create: {
        id: "demo-lead-2",
        email: "sarah.runner@example.com",
        name: "Sarah Smith",
        outreachStatus: "contacted",
        personaId: persona.id,
        sourceUrl: "https://running-community.com/profile/sarah",
        discoveredVia: "social_media",
        interests: ["running", "fitness-tracking", "nutrition"],
        painPoints: ["injury prevention", "performance plateau"],
        metadata: {
          engagementLevel: "medium",
          lastActivity: new Date().toISOString(),
          score: 72,
        },
      },
    }),
    db.customerLead.upsert({
      where: { id: "demo-lead-3" },
      update: {},
      create: {
        id: "demo-lead-3",
        email: "mike.gains@example.com",
        name: "Mike Johnson",
        outreachStatus: "responded",
        personaId: persona.id,
        sourceUrl: "https://bodybuilding-forum.com/user/mike",
        discoveredVia: "forum",
        interests: ["bodybuilding", "protein-powder", "workout-apps"],
        painPoints: ["muscle growth", "supplement choices"],
        metadata: {
          engagementLevel: "very-high",
          lastActivity: new Date().toISOString(),
          score: 95,
          convertedOfferId: offers[0].id,
          conversionValue: 125.0,
        },
      },
    }),
  ]);

  console.log(`✅ Created ${leads.length} leads`);

  // Create some demo campaign results
  const results = await Promise.all([
    db.result.create({
      data: {
        campaignId: campaign.id,
        channel: "email",
        metrics: {
          sent: 5000,
          clicks: 450,
          conversions: 42,
          revenue: 1890.0,
          ctr: 0.09,
          cvr: 0.093,
        },
        ts: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    }),
    db.result.create({
      data: {
        campaignId: campaign.id,
        channel: "social",
        metrics: {
          impressions: 25000,
          clicks: 1200,
          conversions: 38,
          revenue: 1710.0,
          ctr: 0.048,
          cvr: 0.032,
        },
        ts: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      },
    }),
    db.result.create({
      data: {
        campaignId: campaign.id,
        channel: "content",
        metrics: {
          impressions: 15000,
          clicks: 780,
          conversions: 51,
          revenue: 2295.0,
          ctr: 0.052,
          cvr: 0.065,
        },
        ts: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      },
    }),
  ]);

  console.log(`✅ Created ${results.length} campaign results`);

  // Create some demo agent tasks
  const tasks = await Promise.all([
    db.agentTask.create({
      data: {
        agentId: agent.id,
        type: "OFFER_SYNC",
        status: "completed",
        startedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
        output: {
          success: true,
          offersFound: 127,
          offersAdded: 43,
          duration: 145,
        },
      },
    }),
    db.agentTask.create({
      data: {
        agentId: agent.id,
        type: "OFFER_SCORING",
        status: "completed",
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
        output: {
          success: true,
          offersScored: 43,
          avgScore: 82.5,
          duration: 72,
        },
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} agent tasks`);

  console.log("\n🎉 Demo data seeded successfully!");
  console.log("\nYou now have:");
  console.log(`- 1 persona (${persona.name})`);
  console.log(`- ${offers.length} offers`);
  console.log(`- 1 agent (${agent.name})`);
  console.log(`- 1 campaign (${campaign.name})`);
  console.log(`- ${leads.length} leads`);
  console.log(`- ${results.length} campaign results`);
  console.log(`- ${tasks.length} agent tasks`);
  console.log("\n✨ Visit http://localhost:3000 to see the data!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
