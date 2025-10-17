import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import * as emailService from "~/server/services/email-service";

export const listLeadEmails = baseProcedure
  .input(
    z.object({
      leadId: z.string(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    const emails = await db.sentEmail.findMany({
      where: { leadId: input.leadId },
      take: input.limit,
      skip: input.offset,
      orderBy: { createdAt: "desc" },
    });

    const total = await db.sentEmail.count({
      where: { leadId: input.leadId },
    });

    return {
      emails,
      total,
      hasMore: input.offset + input.limit < total,
    };
  });

export const getEmailStats = baseProcedure
  .input(z.object({ leadId: z.string() }))
  .query(async ({ input }) => {
    return await emailService.getLeadEmailStats(input.leadId);
  });

export const handleSendGridWebhook = baseProcedure
  .input(
    z.array(
      z.object({
        email: z.string(),
        timestamp: z.number(),
        event: z.string(),
        sg_message_id: z.string().optional(),
        url: z.string().optional(),
        reason: z.string().optional(),
      })
    )
  )
  .mutation(async ({ input }) => {
    await emailService.handleWebhookBatch(input);
    return { success: true };
  });

export const getGlobalEmailStats = baseProcedure
  .input(
    z.object({
      personaId: z.string().optional(),
      days: z.number().min(1).max(90).default(30),
    }).optional()
  )
  .query(async ({ input }) => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - (input?.days || 30));

    const where: any = {
      createdAt: { gte: daysAgo },
    };

    // If personaId is provided, filter by leads belonging to that persona
    if (input?.personaId) {
      where.lead = {
        personaId: input.personaId,
      };
    }

    const emails = await db.sentEmail.findMany({
      where,
      include: {
        lead: {
          select: {
            personaId: true,
          },
        },
      },
    });

    const stats = {
      totalSent: emails.length,
      delivered: emails.filter(e => ["delivered", "opened", "clicked"].includes(e.status)).length,
      opened: emails.filter(e => ["opened", "clicked"].includes(e.status)).length,
      clicked: emails.filter(e => e.status === "clicked").length,
      bounced: emails.filter(e => e.status === "bounced").length,
      failed: emails.filter(e => e.status === "failed").length,
      totalOpens: emails.reduce((sum, e) => sum + e.openCount, 0),
      totalClicks: emails.reduce((sum, e) => sum + e.clickCount, 0),
      openRate: 0,
      clickRate: 0,
      clickThroughRate: 0,
    };

    if (stats.delivered > 0) {
      stats.openRate = (stats.opened / stats.delivered) * 100;
      stats.clickRate = (stats.clicked / stats.delivered) * 100;
    }

    if (stats.opened > 0) {
      stats.clickThroughRate = (stats.clicked / stats.opened) * 100;
    }

    return stats;
  });
