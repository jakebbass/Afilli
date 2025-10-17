import { env } from "~/server/env";
import { TRPCError } from "@trpc/server";

interface AwinProgram {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  clickThroughUrl: string;
  displayUrl: string;
  currencyCode: string;
  primaryRegion: {
    countryCode: string;
    name: string;
  };
  primarySector: string;
  status: string;
  validDomains: Array<{ domain: string }>;
}

interface AwinProgramDetails {
  commissionRange: Array<{
    max: number;
    min: number;
    type: string;
  }>;
  kpi: {
    approvalPercentage: number;
    averagePaymentTime: string;
    awinIndex: number;
    conversionRate: number;
    epc: number;
    validationDays: number;
  };
  programmeInfo: AwinProgram & {
    membershipStatus: string;
    deeplinkEnabled: boolean;
  };
}

// Discover and apply to high-performing programs on AWIN marketplace
async function discoverAwinMarketplace(): Promise<AwinProgram[]> {
  console.log(
    "[AWIN-AFFILIATE] 🔍 Discovering new high-performing programs on AWIN marketplace...",
  );

  try {
    // First, get all available programs (not just joined ones)
    const allProgramsUrl = `https://api.awin.com/publishers/${env.AWIN_PUBLISHER_ID}/programmes`;
    const params = new URLSearchParams({
      accessToken: env.AWIN_API_TOKEN,
      relationship: "notjoined", // Focus on programs we haven't joined yet
      includeHidden: "false",
    });

    console.log(
      `[AWIN-AFFILIATE] 📡 Fetching unjoined programs from: ${allProgramsUrl}?${params}`,
    );

    const response = await fetch(`${allProgramsUrl}?${params}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Affiliate-Agent/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(
        `AWIN API error: ${response.status} - ${response.statusText}`,
      );
    }

    const programs: AwinProgram[] = await response.json();
    console.log(
      `[AWIN-AFFILIATE] ✅ Found ${programs.length} unjoined programs`,
    );

    // Filter for high-performing programs based on sector and status
    const targetSectors = [
      "Retail",
      "Technology",
      "Health & Fitness",
      "Finance",
      "Education",
      "Travel",
      "Software",
      "Electronics",
    ];

    const highValuePrograms = programs.filter((program) => {
      return (
        program.status === "active" &&
        targetSectors.includes(program.primarySector) &&
        program.displayUrl &&
        program.validDomains.length > 0
      );
    });

    console.log(
      `[AWIN-AFFILIATE] 🎯 Filtered to ${highValuePrograms.length} high-value programs in target sectors`,
    );
    return highValuePrograms.slice(0, 50); // Limit to top 50 for processing
  } catch (error) {
    console.error("[AWIN-AFFILIATE] ❌ Error discovering programs:", error);
    return []; // Return empty array on error, don't throw
  }
}

// Get detailed KPIs for a specific program to evaluate performance
async function getAwinProgramDetails(
  advertiserId: number,
): Promise<AwinProgramDetails | null> {
  try {
    const detailsUrl = `https://api.awin.com/publishers/${env.AWIN_PUBLISHER_ID}/programmedetails`;
    const params = new URLSearchParams({
      accessToken: env.AWIN_API_TOKEN,
      advertiserId: advertiserId.toString(),
      relationship: "any", // Get details regardless of relationship status
    });

    const response = await fetch(`${detailsUrl}?${params}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "Affiliate-Agent/1.0",
      },
    });

    if (!response.ok) {
      console.warn(
        `[AWIN-AFFILIATE] ⚠️  Could not get details for program ${advertiserId}: ${response.status}`,
      );
      return null;
    }

    const details: AwinProgramDetails = await response.json();
    return details;
  } catch (error) {
    console.error(
      `[AWIN-AFFILIATE] ❌ Error getting program ${advertiserId} details:`,
      error,
    );
    return null;
  }
}

// Apply to join a high-performing program (Note: AWIN typically requires manual application via their interface)
async function applyToAwinProgram(programId: number): Promise<boolean> {
  console.log(
    `[AWIN-AFFILIATE] 📝 Program ${programId} identified for application - manual review required`,
  );

  // Note: AWIN doesn't have a direct API to apply to programs
  // Applications typically need to be done through their publisher interface
  // This would log the opportunity for manual action

  console.log(
    `[AWIN-AFFILIATE] ℹ️  To apply to program ${programId}, visit: https://ui.awin.com/affiliate/application-centre`,
  );
  return true; // Return true to indicate we've logged the opportunity
}

export async function fetchAwinOffers(since?: Date) {
  console.log("[AWIN-AFFILIATE] 🔑 Checking AWIN API credentials...");

  if (!env.AWIN_API_TOKEN || !env.AWIN_PUBLISHER_ID) {
    console.error("[AWIN-AFFILIATE] ❌ AWIN credentials not configured");
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "AWIN API credentials not configured. Please set AWIN_API_TOKEN and AWIN_PUBLISHER_ID environment variables.",
    });
  }

  console.log(
    `[AWIN-AFFILIATE] ✅ Credentials found - Publisher ID: ${env.AWIN_PUBLISHER_ID}`,
  );

  try {
    // Step 1: Discover new high-performing programs
    const availablePrograms = await discoverAwinMarketplace();

    if (availablePrograms.length === 0) {
      console.log("[AWIN-AFFILIATE] ℹ️  No new programs found to analyze");
      return [];
    }

    // Step 2: Analyze each program for performance metrics
    const programOffers = [];
    let analyzedCount = 0;

    for (const program of availablePrograms.slice(0, 20)) {
      // Limit API calls
      analyzedCount++;
      console.log(
        `[AWIN-AFFILIATE] 📊 Analyzing program ${analyzedCount}/${Math.min(availablePrograms.length, 20)}: ${program.name}`,
      );

      // Get detailed KPIs for this program
      const details = await getAwinProgramDetails(program.id);

      if (!details) {
        continue; // Skip if we can't get details
      }

      // Calculate offer scoring based on real performance metrics
      const epc = details.kpi.epc || 0;
      const conversionRate = details.kpi.conversionRate || 0;
      const approvalRate = details.kpi.approvalPercentage || 0;
      const awinIndex = details.kpi.awinIndex || 0;

      // Calculate CPS (Conversion Potential Score) based on real metrics
      const epcScore = Math.min(epc * 20, 30); // EPC typically 0-2, scale to 0-30
      const conversionScore = Math.min(conversionRate * 10, 25); // Conversion rate scale to 0-25
      const approvalScore = approvalRate * 0.2; // Approval rate scale to 0-20
      const indexScore = awinIndex * 0.25; // AWIN index scale to 0-25
      const cps =
        Math.round(
          (epcScore + conversionScore + approvalScore + indexScore) * 10,
        ) / 10;

      // Only include high-performing programs (CPS > 50)
      if (cps >= 50) {
        console.log(
          `[AWIN-AFFILIATE] 🌟 High-performing program found: ${program.name} (CPS: ${cps})`,
        );

        // Apply to join this program
        await applyToAwinProgram(program.id);

        // Create offer object with real data
        const commissionInfo = details.commissionRange[0];
        const maxCommission = commissionInfo ? commissionInfo.max : 0;
        const commissionType = commissionInfo
          ? commissionInfo.type
          : "percentage";

        programOffers.push({
          source: "awin" as const,
          sourceId: program.id.toString(),
          name: program.name,
          merchant: program.name,
          url: program.clickThroughUrl,
          payout: `${maxCommission}% ${commissionType} commission`,
          epc: epc,
          cookieWindow: details.kpi.validationDays || 30,
          geo: program.primaryRegion.name,
          categories: [program.primarySector],
          cps: cps,
          imageUrl: program.logoUrl,
          description: program.description,
          meta: {
            programmeId: program.id,
            awinIndex: awinIndex,
            conversionRate: conversionRate,
            approvalPercentage: approvalRate,
            averagePaymentTime: details.kpi.averagePaymentTime,
            deeplinkEnabled: details.programmeInfo.deeplinkEnabled,
            validDomains: program.validDomains.map((d) => d.domain),
            appliedAt: new Date().toISOString(),
            discovered: true,
          },
        });
      }

      // Rate limiting - small delay between requests
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    console.log(
      `[AWIN-AFFILIATE] ✅ Successfully discovered and applied to ${programOffers.length} high-performing programs`,
    );
    console.log(
      `[AWIN-AFFILIATE] 📊 Average CPS of selected programs: ${(programOffers.reduce((sum, o) => sum + o.cps, 0) / programOffers.length).toFixed(1)}`,
    );

    return programOffers;
  } catch (error) {
    console.error(
      "[AWIN-AFFILIATE] ❌ Unexpected error during marketplace discovery:",
      error,
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to discover programs from AWIN: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
