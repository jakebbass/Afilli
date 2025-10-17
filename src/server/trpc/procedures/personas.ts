import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const listPersonas = baseProcedure.query(async () => {
  const personas = await db.persona.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          campaigns: true,
        },
      },
    },
  });

  return personas;
});

export const getPersona = baseProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const persona = await db.persona.findUnique({
      where: { id: input.id },
      include: {
        campaigns: {
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!persona) {
      throw new Error("Persona not found");
    }

    return persona;
  });

export const createPersona = baseProcedure
  .input(
    z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      hypotheses: z.array(z.any()).default([]),
      signals: z.array(z.any()).default([]),
      channels: z.array(z.string()).default([]),
      audienceSizeEst: z.number().optional(),
      clvEst: z.number().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const persona = await db.persona.create({
      data: input,
    });

    return persona;
  });

export const updatePersona = baseProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      hypotheses: z.array(z.any()).optional(),
      signals: z.array(z.any()).optional(),
      channels: z.array(z.string()).optional(),
      audienceSizeEst: z.number().optional(),
      clvEst: z.number().optional(),
      metrics: z.any().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;

    const persona = await db.persona.update({
      where: { id },
      data,
    });

    return persona;
  });

export const suggestPersonas = baseProcedure
  .input(z.object({ offerId: z.string() }))
  .query(async ({ input }) => {
    const offer = await db.offer.findUnique({
      where: { id: input.offerId },
    });

    if (!offer) {
      throw new Error("Offer not found");
    }

    // Get all personas and score them based on fit with the offer
    const personas = await db.persona.findMany();

    const scored = personas.map((persona) => {
      let score = 0;

      // Match categories with persona signals
      const signals = (persona.signals as any[]) || [];
      signals.forEach((signal: any) => {
        if (signal.type === "keyword") {
          const matchesCategory = offer.categories.some((cat) =>
            cat.toLowerCase().includes(signal.value.toLowerCase()),
          );
          if (matchesCategory) {
            score += signal.weight * 10;
          }
        }
      });

      // Check if persona channels align with offer type
      const channels = (persona.channels as any[]) || [];
      if (channels.length > 0) {
        score += 5; // Bonus for having defined channels
      }

      return {
        ...persona,
        fitScore: score,
      };
    });

    // Sort by fit score and return top matches
    return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);
  });
