import { env } from "~/server/env";
import { TRPCError } from "@trpc/server";

interface ClayEnrichmentInput {
  name?: string;
  company?: string;
  website?: string;
  email?: string;
  linkedinUrl?: string;
}

interface ClayEnrichmentResult {
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  companyName?: string;
  companyWebsite?: string;
  companySize?: string;
  companyIndustry?: string;
  jobTitle?: string;
  location?: string;
  technologies?: string[];
  confidence: number;
}

interface ClayApiResponse {
  data: {
    enrichment: ClayEnrichmentResult;
    status: string;
  };
}

export async function enrichLeadWithClay(
  input: ClayEnrichmentInput
): Promise<ClayEnrichmentResult> {
  // Check if Clay API key is configured
  if (!env.CLAY_API_KEY) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Clay API credentials not configured. Please set CLAY_API_KEY environment variable.",
    });
  }

  try {
    // Clay API endpoint for enrichment
    const url = "https://api.clay.com/v1/enrichment";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.CLAY_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        input: {
          name: input.name,
          company: input.company,
          website: input.website,
          email: input.email,
          linkedin_url: input.linkedinUrl,
        },
        enrichments: [
          "email",
          "phone",
          "linkedin",
          "twitter",
          "company_info",
          "job_title",
          "location",
          "technologies",
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Clay API Error:", response.status, errorText);

      if (response.status === 401 || response.status === 403) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid Clay API credentials. Please check your CLAY_API_KEY.",
        });
      }

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Clay API error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json() as ClayApiResponse;

    if (data.data.status !== "completed") {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Clay enrichment failed or is still processing",
      });
    }

    return data.data.enrichment;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }

    console.error("Error enriching lead with Clay:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to enrich lead with Clay: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

export async function findEmailWithClay(
  name: string,
  company: string,
  website?: string
): Promise<string | null> {
  try {
    const result = await enrichLeadWithClay({
      name,
      company,
      website,
    });

    return result.email || null;
  } catch (error) {
    console.error("Error finding email with Clay:", error);
    return null;
  }
}

export async function enrichCompanyWithClay(
  companyName: string,
  website?: string
): Promise<Partial<ClayEnrichmentResult>> {
  try {
    const result = await enrichLeadWithClay({
      company: companyName,
      website,
    });

    return {
      companyName: result.companyName,
      companyWebsite: result.companyWebsite,
      companySize: result.companySize,
      companyIndustry: result.companyIndustry,
      technologies: result.technologies,
      confidence: result.confidence,
    };
  } catch (error) {
    console.error("Error enriching company with Clay:", error);
    return {};
  }
}
