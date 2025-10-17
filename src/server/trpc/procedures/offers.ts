import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { fetchAwinOffers } from "~/server/services/awin-affiliate";
import { fetchClickbankOffers } from "~/server/services/clickbank-affiliate";

export const listOffers = baseProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      source: z.string().optional(),
      category: z.string().optional(),
      minCps: z.number().optional(),
      search: z.string().optional(),
      sortBy: z.enum(["cps", "epc", "payout", "createdAt"]).default("cps"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  )
  .query(async ({ input }) => {
    const where: any = {};

    if (input.source) {
      where.source = input.source;
    }

    if (input.category) {
      where.categories = {
        has: input.category,
      };
    }

    if (input.minCps) {
      where.cps = {
        gte: input.minCps,
      };
    }

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: "insensitive" } },
        { merchant: { contains: input.search, mode: "insensitive" } },
        { description: { contains: input.search, mode: "insensitive" } },
      ];
    }

    const [offers, total] = await Promise.all([
      db.offer.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
      }),
      db.offer.count({ where }),
    ]);

    return {
      offers,
      total,
      hasMore: input.offset + input.limit < total,
    };
  });

export const getOffer = baseProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const offer = await db.offer.findUnique({
      where: { id: input.id },
    });

    if (!offer) {
      throw new Error("Offer not found");
    }

    return offer;
  });

export const rankOffers = baseProcedure
  .input(
    z.object({
      personaId: z.string().optional(),
      limit: z.number().min(1).max(50).default(10),
    }),
  )
  .query(async ({ input }) => {
    // Get offers sorted by CPS
    const offers = await db.offer.findMany({
      take: input.limit,
      orderBy: {
        cps: "desc",
      },
    });

    // If personaId provided, re-rank based on persona fit
    if (input.personaId) {
      const persona = await db.persona.findUnique({
        where: { id: input.personaId },
      });

      if (persona) {
        // Simple persona-offer matching based on categories and channels
        const personaChannels = (persona.channels as any) || [];
        const personaSignals = (persona.signals as any[]) || [];

        // Re-score offers based on persona fit
        const rankedOffers = offers.map((offer) => {
          let personaFitScore = offer.cps;

          // Boost score if offer categories match persona signals
          personaSignals.forEach((signal: any) => {
            if (signal.type === "keyword") {
              const matchesCategory = offer.categories.some((cat) =>
                cat.toLowerCase().includes(signal.value.toLowerCase()),
              );
              if (matchesCategory) {
                personaFitScore += signal.weight * 5;
              }
            }
          });

          return {
            ...offer,
            personaFitScore,
          };
        });

        // Sort by persona fit score
        rankedOffers.sort((a, b) => b.personaFitScore - a.personaFitScore);

        return rankedOffers.slice(0, input.limit);
      }
    }

    return offers;
  });

export const syncOffers = baseProcedure
  .input(
    z.object({
      source: z.enum(["awin", "cj", "impact", "shareasale", "rakuten", "amazon", "clickbank"]),
      since: z.date().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    let added = 0;
    let updated = 0;

    if (input.source === "awin") {
      console.log(`Syncing offers from Awin...`);
      
      try {
        // Fetch offers from Awin API
        const offers = await fetchAwinOffers(input.since);
        
        console.log(`Fetched ${offers.length} offers from Awin`);
        
        // Upsert each offer into the database
        for (const offer of offers) {
          const existing = await db.offer.findFirst({
            where: {
              source: offer.source,
              sourceId: offer.sourceId,
            },
          });
          
          if (existing) {
            // Update existing offer
            await db.offer.update({
              where: { id: existing.id },
              data: {
                name: offer.name,
                merchant: offer.merchant,
                url: offer.url,
                payout: offer.payout,
                epc: offer.epc,
                cookieWindow: offer.cookieWindow,
                geo: offer.geo,
                categories: offer.categories,
                cps: offer.cps,
                imageUrl: offer.imageUrl,
                description: offer.description,
                meta: offer.meta,
              },
            });
            updated++;
          } else {
            // Create new offer
            await db.offer.create({
              data: offer,
            });
            added++;
          }
        }
        
        console.log(`Sync complete: ${added} added, ${updated} updated`);
      } catch (error) {
        console.error("Error syncing Awin offers:", error);
        throw error;
      }
    } else if (input.source === "clickbank") {
      console.log(`Syncing offers from Clickbank...`);
      
      try {
        // Fetch offers from Clickbank API
        const offers = await fetchClickbankOffers(input.since);
        
        console.log(`Fetched ${offers.length} offers from Clickbank`);
        
        // Upsert each offer into the database
        for (const offer of offers) {
          const existing = await db.offer.findFirst({
            where: {
              source: offer.source,
              sourceId: offer.sourceId,
            },
          });
          
          if (existing) {
            // Update existing offer
            await db.offer.update({
              where: { id: existing.id },
              data: {
                name: offer.name,
                merchant: offer.merchant,
                url: offer.url,
                payout: offer.payout,
                epc: offer.epc,
                cookieWindow: offer.cookieWindow,
                geo: offer.geo,
                categories: offer.categories,
                cps: offer.cps,
                imageUrl: offer.imageUrl,
                description: offer.description,
                meta: offer.meta,
              },
            });
            updated++;
          } else {
            // Create new offer
            await db.offer.create({
              data: offer,
            });
            added++;
          }
        }
        
        console.log(`Sync complete: ${added} added, ${updated} updated`);
      } catch (error) {
        console.error("Error syncing Clickbank offers:", error);
        throw error;
      }
    } else {
      // Other sources would have their own adapters
      throw new Error(`Sync for ${input.source} not yet implemented. Currently Awin and Clickbank are supported.`);
    }

    return {
      source: input.source,
      added,
      updated,
      timestamp: new Date(),
    };
  });

export const getOfferStats = baseProcedure.query(async () => {
  const [total, byCps, bySource] = await Promise.all([
    db.offer.count(),
    db.offer.groupBy({
      by: ["source"],
      _count: true,
      _avg: {
        cps: true,
        epc: true,
      },
    }),
    db.offer.groupBy({
      by: ["source"],
      _count: true,
    }),
  ]);

  return {
    total,
    averageCps:
      byCps.reduce((sum, item) => sum + (item._avg.cps || 0), 0) /
        byCps.length || 0,
    averageEpc:
      byCps.reduce((sum, item) => sum + (item._avg.epc || 0), 0) /
        byCps.length || 0,
    bySource: bySource.map((item) => ({
      source: item.source,
      count: item._count,
    })),
  };
});
