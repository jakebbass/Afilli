import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";

export const ingestEvent = baseProcedure
  .input(
    z.object({
      sessionId: z.string(),
      type: z.enum([
        "page_view",
        "product_view",
        "time_on_page",
        "scroll_depth",
        "email_click",
        "social_click",
        "chat_open",
        "add_to_cart_intent",
      ]),
      payload: z.any(),
      userId: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const event = await db.event.create({
      data: input,
    });

    return event;
  });

export const getSessionEvents = baseProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const events = await db.event.findMany({
      where: { sessionId: input.sessionId },
      orderBy: {
        ts: "asc",
      },
    });

    return events;
  });

export const computeBuyScore = baseProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const events = await db.event.findMany({
      where: { sessionId: input.sessionId },
      orderBy: {
        ts: "desc",
      },
      take: 20, // Last 20 events
    });

    let score = 0;

    // Apply scoring rules
    events.forEach((event) => {
      const payload = event.payload as any;

      switch (event.type) {
        case "page_view":
          score += 5;
          break;
        case "product_view":
          score += 20;
          if (payload.duration && payload.duration > 30) {
            score += 10; // Bonus for longer views
          }
          break;
        case "time_on_page":
          if (payload.duration > 90) {
            score += 10;
          }
          break;
        case "scroll_depth":
          if (payload.depth > 75) {
            score += 10;
          }
          break;
        case "email_click":
          score += 15;
          break;
        case "social_click":
          score += 12;
          break;
        case "chat_open":
          score += 5;
          break;
        case "add_to_cart_intent":
          score += 25;
          break;
      }
    });

    // Check for repeat visits
    const uniqueDays = new Set(
      events.map((e) => e.ts.toISOString().split("T")[0]),
    );
    if (uniqueDays.size > 1) {
      score += 15; // Repeat visitor bonus
    }

    // Cap at 100
    score = Math.min(score, 100);

    return {
      sessionId: input.sessionId,
      buyScore: score,
      eventCount: events.length,
      recommendation: score >= 60 ? "high_intent" : score >= 30 ? "medium_intent" : "low_intent",
    };
  });
