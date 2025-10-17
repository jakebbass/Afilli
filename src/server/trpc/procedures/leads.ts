import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const listLeads = baseProcedure
  .input(
    z.object({
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      personaId: z.string().optional(),
      outreachStatus: z.enum(['discovered', 'contacted', 'responded', 'converted', 'unqualified']).optional(),
      search: z.string().optional(),
      sortBy: z.enum(['createdAt', 'lastContactedAt', 'outreachAttempts']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
    })
  )
  .query(async ({ input }) => {
    const where: any = {};

    if (input.personaId) {
      where.personaId = input.personaId;
    }

    if (input.outreachStatus) {
      where.outreachStatus = input.outreachStatus;
    }

    if (input.search) {
      where.OR = [
        { name: { contains: input.search, mode: 'insensitive' } },
        { company: { contains: input.search, mode: 'insensitive' } },
        { email: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      db.customerLead.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: {
          [input.sortBy]: input.sortOrder,
        },
        include: {
          persona: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      db.customerLead.count({ where }),
    ]);

    return {
      leads,
      total,
      hasMore: input.offset + input.limit < total,
    };
  });

export const getLead = baseProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const lead = await db.customerLead.findUnique({
      where: { id: input.id },
      include: {
        persona: true,
      },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get recommended offers
    const offers = await db.offer.findMany({
      where: {
        id: { in: lead.recommendedOffers },
      },
    });

    return {
      ...lead,
      offers,
    };
  });

export const updateLead = baseProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().optional(),
      company: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      outreachStatus: z.enum(['discovered', 'contacted', 'responded', 'converted', 'unqualified']).optional(),
      notes: z.string().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;

    const lead = await db.customerLead.update({
      where: { id },
      data,
    });

    return lead;
  });

export const getLeadStats = baseProcedure
  .input(
    z.object({
      personaId: z.string().optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const where: any = {};

    if (input?.personaId) {
      where.personaId = input.personaId;
    }

    const [total, byStatus, byDiscoveryMethod] = await Promise.all([
      db.customerLead.count({ where }),
      db.customerLead.groupBy({
        by: ['outreachStatus'],
        where,
        _count: true,
      }),
      db.customerLead.groupBy({
        by: ['discoveredVia'],
        where,
        _count: true,
      }),
    ]);

    const recentLeads = await db.customerLead.count({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    });

    return {
      total,
      recentLeads,
      byStatus: byStatus.map(item => ({
        status: item.outreachStatus,
        count: item._count,
      })),
      byDiscoveryMethod: byDiscoveryMethod.map(item => ({
        method: item.discoveredVia,
        count: item._count,
      })),
    };
  });

export const recommendOffersForLead = baseProcedure
  .input(z.object({ leadId: z.string() }))
  .mutation(async ({ input }) => {
    const lead = await db.customerLead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // Get all offers
    const allOffers = await db.offer.findMany({
      orderBy: { cps: 'desc' },
      take: 50,
    });

    // Score offers based on lead interests and pain points
    const scoredOffers = allOffers.map(offer => {
      let score = offer.cps;

      // Boost score if offer categories match lead interests
      lead.interests.forEach(interest => {
        const matchesCategory = offer.categories.some(cat =>
          cat.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(cat.toLowerCase())
        );
        if (matchesCategory) {
          score += 20;
        }
      });

      // Boost score if offer description mentions pain points
      lead.painPoints.forEach(painPoint => {
        if (offer.description?.toLowerCase().includes(painPoint.toLowerCase())) {
          score += 15;
        }
      });

      return {
        ...offer,
        matchScore: score,
      };
    });

    // Sort by match score and take top 5
    const topOffers = scoredOffers
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 5);

    // Update lead with recommended offers
    await db.customerLead.update({
      where: { id: input.leadId },
      data: {
        recommendedOffers: topOffers.map(o => o.id),
      },
    });

    return topOffers;
  });
