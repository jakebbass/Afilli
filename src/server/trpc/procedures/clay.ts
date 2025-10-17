import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import { enrichLeadWithClay, findEmailWithClay } from "~/server/services/clay-integration";

export const enrichLead = baseProcedure
  .input(
    z.object({
      leadId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const lead = await db.customerLead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    // Prepare enrichment input
    const enrichmentInput = {
      name: lead.name || undefined,
      company: lead.company || undefined,
      website: lead.website || undefined,
      email: lead.email || undefined,
    };

    // Enrich with Clay
    const enrichmentResult = await enrichLeadWithClay(enrichmentInput);

    // Update lead with enriched data
    const updatedLead = await db.customerLead.update({
      where: { id: input.leadId },
      data: {
        email: enrichmentResult.email || lead.email,
        phone: enrichmentResult.phone || lead.phone,
        website: enrichmentResult.companyWebsite || lead.website,
        metadata: {
          ...(typeof lead.metadata === 'object' && lead.metadata !== null ? lead.metadata : {}),
          clayEnrichment: {
            enrichedAt: new Date().toISOString(),
            confidence: enrichmentResult.confidence,
            linkedinUrl: enrichmentResult.linkedinUrl,
            twitterUrl: enrichmentResult.twitterUrl,
            jobTitle: enrichmentResult.jobTitle,
            location: enrichmentResult.location,
            companySize: enrichmentResult.companySize,
            companyIndustry: enrichmentResult.companyIndustry,
            technologies: enrichmentResult.technologies,
          },
        },
      },
    });

    return {
      lead: updatedLead,
      enrichmentResult,
    };
  });

export const findEmail = baseProcedure
  .input(
    z.object({
      leadId: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const lead = await db.customerLead.findUnique({
      where: { id: input.leadId },
    });

    if (!lead) {
      throw new Error("Lead not found");
    }

    if (!lead.name || !lead.company) {
      throw new Error("Lead must have name and company to find email");
    }

    // Find email with Clay
    const email = await findEmailWithClay(
      lead.name,
      lead.company,
      lead.website || undefined
    );

    if (email) {
      // Update lead with found email
      await db.customerLead.update({
        where: { id: input.leadId },
        data: { email },
      });
    }

    return { email };
  });

export const batchEnrich = baseProcedure
  .input(
    z.object({
      leadIds: z.array(z.string()).max(50), // Limit to 50 leads per batch
    })
  )
  .mutation(async ({ input }) => {
    const results = [];

    for (const leadId of input.leadIds) {
      try {
        const lead = await db.customerLead.findUnique({
          where: { id: leadId },
        });

        if (!lead) {
          results.push({
            leadId,
            success: false,
            error: "Lead not found",
          });
          continue;
        }

        // Prepare enrichment input
        const enrichmentInput = {
          name: lead.name || undefined,
          company: lead.company || undefined,
          website: lead.website || undefined,
          email: lead.email || undefined,
        };

        // Enrich with Clay
        const enrichmentResult = await enrichLeadWithClay(enrichmentInput);

        // Update lead with enriched data
        const updatedLead = await db.customerLead.update({
          where: { id: leadId },
          data: {
            email: enrichmentResult.email || lead.email,
            phone: enrichmentResult.phone || lead.phone,
            website: enrichmentResult.companyWebsite || lead.website,
            metadata: {
              ...(typeof lead.metadata === 'object' && lead.metadata !== null ? lead.metadata : {}),
              clayEnrichment: {
                enrichedAt: new Date().toISOString(),
                confidence: enrichmentResult.confidence,
                linkedinUrl: enrichmentResult.linkedinUrl,
                twitterUrl: enrichmentResult.twitterUrl,
                jobTitle: enrichmentResult.jobTitle,
                location: enrichmentResult.location,
                companySize: enrichmentResult.companySize,
                companyIndustry: enrichmentResult.companyIndustry,
                technologies: enrichmentResult.technologies,
              },
            },
          },
        });

        results.push({
          leadId,
          success: true,
          data: {
            lead: updatedLead,
            enrichmentResult,
          },
        });
      } catch (error) {
        results.push({
          leadId,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      total: input.leadIds.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  });
