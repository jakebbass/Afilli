import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import * as emailService from "~/server/services/email-service";

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
