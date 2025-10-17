import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const listCampaigns = baseProcedure
  .input(
    z.object({
      status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      personaId: z.string().optional(),
    }),
  )
  .query(async ({ input }) => {
    const where: any = {};

    if (input.status) {
      where.status = input.status;
    }

    if (input.personaId) {
      where.personaId = input.personaId;
    }

    const campaigns = await db.campaign.findMany({
      where,
      include: {
        persona: true,
        _count: {
          select: {
            creatives: true,
            flights: true,
            results: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return campaigns;
  });

export const getCampaign = baseProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const campaign = await db.campaign.findUnique({
      where: { id: input.id },
      include: {
        persona: true,
        creatives: true,
        flights: true,
        results: {
          orderBy: {
            ts: "desc",
          },
          take: 10,
        },
      },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    return campaign;
  });

export const createCampaign = baseProcedure
  .input(
    z.object({
      name: z.string().min(1),
      personaId: z.string(),
      channels: z.array(z.string()),
      offerIds: z.array(z.string()),
      goals: z.any().optional(),
      budget: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const campaign = await db.campaign.create({
      data: {
        ...input,
        status: "draft",
      },
    });

    return campaign;
  });

export const updateCampaign = baseProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      status: z.enum(["draft", "active", "paused", "completed"]).optional(),
      channels: z.array(z.string()).optional(),
      offerIds: z.array(z.string()).optional(),
      goals: z.any().optional(),
      budget: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;

    const campaign = await db.campaign.update({
      where: { id },
      data,
    });

    return campaign;
  });

export const getCampaignAnalytics = baseProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const results = await db.result.findMany({
      where: { campaignId: input.id },
      orderBy: {
        ts: "desc",
      },
    });

    // Aggregate metrics across all results
    const aggregated = results.reduce(
      (acc, result) => {
        const metrics = result.metrics as any;
        acc.totalSent += metrics.sent || 0;
        acc.totalClicks += metrics.clicks || 0;
        acc.totalConversions += metrics.conversions || 0;
        acc.totalRevenue += metrics.revenue || 0;
        return acc;
      },
      {
        totalSent: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
      },
    );

    const ctr =
      aggregated.totalSent > 0
        ? aggregated.totalClicks / aggregated.totalSent
        : 0;
    const cvr =
      aggregated.totalClicks > 0
        ? aggregated.totalConversions / aggregated.totalClicks
        : 0;

    return {
      ...aggregated,
      ctr,
      cvr,
      resultsByChannel: results.reduce(
        (acc, result) => {
          if (!acc[result.channel]) {
            acc[result.channel] = [];
          }
          acc[result.channel].push(result);
          return acc;
        },
        {} as Record<string, typeof results>,
      ),
    };
  });

export const getDashboardStats = baseProcedure.query(async () => {
  const [campaigns, results, offers, personas] = await Promise.all([
    db.campaign.findMany({
      where: {
        status: "active",
      },
    }),
    db.result.findMany({
      orderBy: {
        ts: "desc",
      },
      take: 100,
    }),
    db.offer.findMany({
      orderBy: {
        cps: "desc",
      },
      take: 10,
    }),
    db.persona.findMany({
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
      },
    }),
  ]);

  // Aggregate all metrics
  const aggregated = results.reduce(
    (acc, result) => {
      const metrics = result.metrics as any;
      acc.totalSent += metrics.sent || 0;
      acc.totalClicks += metrics.clicks || 0;
      acc.totalConversions += metrics.conversions || 0;
      acc.totalRevenue += metrics.revenue || 0;
      return acc;
    },
    {
      totalSent: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalRevenue: 0,
    },
  );

  const ctr =
    aggregated.totalSent > 0
      ? aggregated.totalClicks / aggregated.totalSent
      : 0;
  const cvr =
    aggregated.totalClicks > 0
      ? aggregated.totalConversions / aggregated.totalClicks
      : 0;

  // Get last 7 days and 30 days results for comparison
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const last7Days = results.filter((r) => r.ts >= sevenDaysAgo);
  const last30Days = results.filter((r) => r.ts >= thirtyDaysAgo);

  return {
    activeCampaigns: campaigns.length,
    totalRevenue: aggregated.totalRevenue,
    ctr,
    cvr,
    topOffers: offers.slice(0, 5),
    topPersonas: personas
      .sort((a, b) => b._count.campaigns - a._count.campaigns)
      .slice(0, 3),
    recentResults: results.slice(0, 10),
    trends: {
      last7Days: last7Days.length,
      last30Days: last30Days.length,
    },
  };
});
