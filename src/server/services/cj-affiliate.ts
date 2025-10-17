import { env } from "~/server/env";
import { TRPCError } from "@trpc/server";

interface CJAdvertiser {
  "advertiser-id": number;
  "advertiser-name": string;
  "program-url": string;
  "relationship-status": string;
  "network-rank": number;
  "primary-category": {
    parent: string;
    child: string;
  };
  "performance-incentives": {
    "incentive-type": string;
    "incentive-description": string;
  }[];
  actions: {
    action: Array<{
      "action-id": number;
      "action-type": string;
      "commission": {
        "default": string;
      };
      "cookie-days": number;
    }>;
  };
  "seven-day-epc": number;
  "three-month-epc": number;
}

interface CJApiResponse {
  advertisers: {
    advertiser: CJAdvertiser[];
  };
}

function transformCJAdvertisersToOffers(data: CJApiResponse) {
  const advertisers = data.advertisers?.advertiser || [];
  
  return advertisers.map((advertiser) => {
    // Get the primary action (usually the main commission structure)
    const primaryAction = advertiser.actions?.action?.[0];
    
    // Extract commission information
    const commissionDefault = primaryAction?.commission?.default || "N/A";
    const cookieDays = primaryAction?.["cookie-days"] || 30;
    
    // Calculate EPC (use 7-day EPC, fallback to 3-month)
    const epc = advertiser["seven-day-epc"] || advertiser["three-month-epc"] || 0;
    
    // Calculate CPS (Conversion Potential Score) based on network rank and EPC
    // Network rank is 1-5, with 1 being best. We invert it for our scoring.
    const networkRankScore = (6 - (advertiser["network-rank"] || 3)) * 20; // 0-100 scale
    const epcScore = Math.min(epc / 2, 50); // Normalize EPC to 0-50 scale
    const cps = networkRankScore + epcScore;
    
    // Extract categories
    const categories: string[] = [];
    if (advertiser["primary-category"]?.parent) {
      categories.push(advertiser["primary-category"].parent);
    }
    if (advertiser["primary-category"]?.child) {
      categories.push(advertiser["primary-category"].child);
    }
    
    // Build the offer object
    return {
      source: "cj" as const,
      sourceId: advertiser["advertiser-id"].toString(),
      name: advertiser["advertiser-name"],
      merchant: advertiser["advertiser-name"],
      url: advertiser["program-url"] || `https://www.cj.com/advertiser/${advertiser["advertiser-id"]}`,
      payout: commissionDefault,
      epc: epc,
      cookieWindow: cookieDays,
      geo: "Global", // CJ doesn't provide geo in this endpoint
      categories: categories.length > 0 ? categories : ["General"],
      cps: Math.round(cps * 10) / 10, // Round to 1 decimal place
      imageUrl: null, // CJ API doesn't provide advertiser logos in this endpoint
      description: advertiser["performance-incentives"]?.[0]?.["incentive-description"] || 
                   `${advertiser["advertiser-name"]} affiliate program`,
      meta: {
        networkRank: advertiser["network-rank"],
        relationshipStatus: advertiser["relationship-status"],
        sevenDayEpc: advertiser["seven-day-epc"],
        threeMonthEpc: advertiser["three-month-epc"],
        performanceIncentives: advertiser["performance-incentives"] || [],
        actions: advertiser.actions?.action || [],
      },
    };
  });
}

export async function fetchCJOffers(since?: Date) {
  console.log('[CJ-AFFILIATE] 🔑 Checking CJ API credentials...');
  
  // Check if CJ credentials are configured
  if (!env.CJ_API_KEY || !env.CJ_WEBSITE_ID) {
    console.error('[CJ-AFFILIATE] ❌ CJ credentials not configured');
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "CJ Affiliate API credentials not configured. Please set CJ_API_KEY and CJ_WEBSITE_ID environment variables.",
    });
  }

  console.log(`[CJ-AFFILIATE] ✅ Credentials found - Website ID: ${env.CJ_WEBSITE_ID}`);

  try {
    // Build query parameters
    const params = new URLSearchParams({
      "website-id": env.CJ_WEBSITE_ID,
      "advertiser-ids": "joined", // Only get advertisers we're already joined with
      "records-per-page": "100",
      "page-number": "1",
    });

    // If since date is provided, filter by recently updated advertisers
    if (since) {
      // CJ API doesn't have a direct "updated since" filter, but we can use this to track
      // In production, you might want to store the last sync time and handle pagination
    }

    const url = `https://advertiser-lookup.api.cj.com/v3/advertiser-lookup?${params.toString()}`;

    console.log(`[CJ-AFFILIATE] 📡 Making API request to CJ: ${url}`);
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${env.CJ_API_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CJ-AFFILIATE] ❌ API Error: ${response.status} ${response.statusText}`, errorText);
      
      if (response.status === 401) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid CJ Affiliate API credentials. Please check your CJ_API_KEY.",
        });
      }
      
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `CJ Affiliate API error: ${response.status} ${response.statusText}`,
      });
    }

    const data = await response.json() as CJApiResponse;
    
    // Transform CJ advertisers to our Offer format
    const offers = transformCJAdvertisersToOffers(data);
    
    console.log(`[CJ-AFFILIATE] ✅ Successfully fetched ${offers.length} advertisers from CJ`);
    console.log(`[CJ-AFFILIATE] 📊 Offer stats: Avg CPS: ${(offers.reduce((sum, o) => sum + o.cps, 0) / offers.length).toFixed(1)}`);
    
    return offers;
  } catch (error) {
    if (error instanceof TRPCError) {
      throw error;
    }
    
    console.error("[CJ-AFFILIATE] ❌ Unexpected error fetching offers:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to fetch offers from CJ Affiliate: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
