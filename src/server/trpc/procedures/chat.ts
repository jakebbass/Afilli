import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";

export const getChatHistory = baseProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    const messages = await db.chatMessage.findMany({
      where: { sessionId: input.sessionId },
      orderBy: {
        ts: "asc",
      },
    });

    return messages;
  });

export const sendMessage = baseProcedure
  .input(
    z.object({
      sessionId: z.string(),
      content: z.string(),
    }),
  )
  .mutation(async ({ input }) => {
    // Save user message
    const userMessage = await db.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        role: "user",
        content: input.content,
      },
    });

    // Get session events to compute buy score
    const events = await db.event.findMany({
      where: { sessionId: input.sessionId },
      orderBy: { ts: "desc" },
      take: 20,
    });

    let buyScore = 0;
    events.forEach((event) => {
      const payload = event.payload as any;
      switch (event.type) {
        case "product_view":
          buyScore += 20;
          break;
        case "email_click":
          buyScore += 15;
          break;
        case "scroll_depth":
          if (payload.depth > 75) buyScore += 10;
          break;
        case "chat_open":
          buyScore += 5;
          break;
      }
    });
    buyScore = Math.min(buyScore, 100);

    // Get relevant offers based on message content
    const allOffers = await db.offer.findMany({
      orderBy: { cps: "desc" },
      take: 50,
    });

    // Simple keyword matching for demo
    const keywords = input.content.toLowerCase().split(" ");
    const relevantOffers = allOffers
      .filter((offer) => {
        const offerText = `${offer.name} ${offer.description} ${offer.categories.join(" ")}`.toLowerCase();
        return keywords.some((keyword) => offerText.includes(keyword));
      })
      .slice(0, 3);

    // Generate AI response
    let responseContent = "I'd be happy to help! ";
    let recommendedOffers = null;

    if (buyScore >= 60 && relevantOffers.length > 0) {
      responseContent += "Based on your interest, here are some products I think you'll love:";
      recommendedOffers = relevantOffers.map((offer) => ({
        id: offer.id,
        name: offer.name,
        merchant: offer.merchant,
        imageUrl: offer.imageUrl,
        description: offer.description,
        payout: offer.payout,
        url: offer.url,
        reason: `Great fit based on your interests`,
      }));
    } else if (relevantOffers.length > 0) {
      responseContent += "I found some options that might interest you. Would you like to learn more about any of these?";
      recommendedOffers = relevantOffers.map((offer) => ({
        id: offer.id,
        name: offer.name,
        merchant: offer.merchant,
        imageUrl: offer.imageUrl,
        description: offer.description,
        payout: offer.payout,
        url: offer.url,
        reason: `Matches your search`,
      }));
    } else {
      responseContent += "Could you tell me more about what you're looking for? I can help you find the perfect products or services.";
    }

    // Save assistant message
    const assistantMessage = await db.chatMessage.create({
      data: {
        sessionId: input.sessionId,
        role: "assistant",
        content: responseContent,
        offers: recommendedOffers,
        buyScore,
      },
    });

    return assistantMessage;
  });

export const recommendProducts = baseProcedure
  .input(z.object({ sessionId: z.string() }))
  .query(async ({ input }) => {
    // Get session events
    const events = await db.event.findMany({
      where: { sessionId: input.sessionId },
      orderBy: { ts: "desc" },
      take: 20,
    });

    // Compute buy score
    let buyScore = 0;
    const productViews: string[] = [];

    events.forEach((event) => {
      const payload = event.payload as any;
      switch (event.type) {
        case "product_view":
          buyScore += 20;
          if (payload.offerId) {
            productViews.push(payload.offerId);
          }
          break;
        case "email_click":
          buyScore += 15;
          break;
        case "scroll_depth":
          if (payload.depth > 75) buyScore += 10;
          break;
        case "time_on_page":
          if (payload.duration > 90) buyScore += 10;
          break;
        case "chat_open":
          buyScore += 5;
          break;
      }
    });
    buyScore = Math.min(buyScore, 100);

    if (buyScore < 60) {
      return {
        buyScore,
        shouldShow: false,
        offers: [],
      };
    }

    // Get top offers
    const offers = await db.offer.findMany({
      orderBy: { cps: "desc" },
      take: 3,
    });

    return {
      buyScore,
      shouldShow: true,
      offers: offers.map((offer) => ({
        id: offer.id,
        name: offer.name,
        merchant: offer.merchant,
        imageUrl: offer.imageUrl,
        description: offer.description,
        payout: offer.payout,
        url: offer.url,
        cps: offer.cps,
      })),
    };
  });
