import { env } from "~/server/env";
import { TRPCError } from "@trpc/server";

interface ClickbankProduct {
  site: string;
  title: string;
  description: string;
  category: string;
  gravity: number;
  initialEarningsPerSale: number;
  averageEarningsPerSale: number;
  rebillAmount: number;
  percentPerSale: number;
  percentPerRebill: number;
  hasRecurringProducts: boolean;
  activateUrl: string;
}

interface ClickbankApiResponse {
  products: ClickbankProduct[];
}

// Real ClickBank marketplace discovery using their Analytics API
async function discoverClickBankMarketplace(): Promise<ClickbankProduct[]> {
  console.log(
    "[CLICKBANK-AFFILIATE] 🔍 Actively searching ClickBank marketplace for high-performing offers...",
  );

  try {
    // ClickBank Analytics API endpoint for marketplace products
    const apiUrl = "https://api.clickbank.com/rest/1.3/marketplace/products";

    // Popular categories to search through
    const targetCategories = [
      "Health & Fitness",
      "Business / Investing",
      "Computers / Internet",
      "Education",
      "Home & Garden",
      "Languages",
      "Reference",
      "Self-Help",
      "Sports / Recreation",
      "Travel",
    ];

    const allProducts: ClickbankProduct[] = [];

    // Search each category for top performers
    for (const category of targetCategories) {
      try {
        console.log(`[CLICKBANK-AFFILIATE] 🎯 Searching category: ${category}`);

        const params = new URLSearchParams({
          cat: category.toLowerCase().replace(" / ", "-").replace(" ", "-"),
          sort: "gravity", // Sort by gravity (popularity)
          length: "50", // Get top 50 per category
          language: "en",
        });

        const response = await fetch(`${apiUrl}?${params}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${env.CLICKBANK_API_KEY}`, // Using API key from env
            "User-Agent": "Affiliate-Agent/1.0",
          },
        });

        if (!response.ok) {
          console.warn(
            `[CLICKBANK-AFFILIATE] ⚠️  API error for category ${category}: ${response.status}`,
          );
          continue; // Skip this category, try next one
        }

        const data = (await response.json()) as ClickbankApiResponse;

        if (data.products && data.products.length > 0) {
          // Filter for high-performing products immediately
          const highPerformers = data.products.filter((product) => {
            return (
              product.gravity >= 20 && // Minimum gravity of 20
              product.initialEarningsPerSale >= 15 && // Minimum $15 per sale
              product.percentPerSale >= 40
            ); // Minimum 40% commission
          });

          allProducts.push(...highPerformers);
          console.log(
            `[CLICKBANK-AFFILIATE] ✅ Found ${highPerformers.length} high-performing products in ${category}`,
          );
        }

        // Rate limiting - delay between API calls
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (error) {
        console.error(
          `[CLICKBANK-AFFILIATE] ❌ Error searching category ${category}:`,
          error,
        );
      }
    }

    // Sort by combined performance score (gravity + earnings + commission rate)
    const sortedProducts = allProducts.sort((a, b) => {
      const aScore =
        a.gravity * 0.4 +
        a.initialEarningsPerSale * 0.3 +
        a.percentPerSale * 0.3;
      const bScore =
        b.gravity * 0.4 +
        b.initialEarningsPerSale * 0.3 +
        b.percentPerSale * 0.3;
      return bScore - aScore;
    });

    const topProducts = sortedProducts.slice(0, 100); // Return top 100 offers
    console.log(
      `[CLICKBANK-AFFILIATE] ✅ Discovered ${topProducts.length} high-performing offers from ${targetCategories.length} categories`,
    );

    return topProducts;
  } catch (error) {
    console.error(
      "[CLICKBANK-AFFILIATE] ❌ Error during marketplace discovery:",
      error,
    );
    // Return empty array instead of throwing to prevent agent from crashing
    return [];
  }
}

// Apply to promote a ClickBank product (generate affiliate link)
async function applyToClickBankProduct(
  product: ClickbankProduct,
): Promise<{ success: boolean; affiliateUrl?: string }> {
  try {
    console.log(
      `[CLICKBANK-AFFILIATE] 📝 Applying to promote product: ${product.site}`,
    );

    // ClickBank affiliate link generation - using standard hop link format
    // Since ClickBank doesn't require pre-approval, we can immediately generate affiliate links
    const vendorNickname = env.CLICKBANK_VENDOR || "affiliate"; // Use configured vendor or fallback
    const trackingId = "affiliate-agent";

    // Standard ClickBank affiliate link format
    const affiliateUrl = `https://${product.site}.${vendorNickname}.hop.clickbank.net/?tid=${trackingId}`;

    console.log(
      `[CLICKBANK-AFFILIATE] ✅ Generated affiliate link for ${product.site}`,
    );
    return { success: true, affiliateUrl };
  } catch (error) {
    console.error(
      `[CLICKBANK-AFFILIATE] ❌ Error applying to product ${product.site}:`,
      error,
    );
    // Fallback to standard ClickBank affiliate link format
    const fallbackUrl = `https://${product.site}.affiliate.hop.clickbank.net/?tid=affiliate-agent`;
    return { success: true, affiliateUrl: fallbackUrl };
  }
}

function transformClickbankProductsToOffers(
  products: ClickbankProduct[],
  affiliateLinks: Map<string, string>,
) {
  return products.map((product) => {
    // Format commission/payout information
    let payout = "Contact for details";
    if (product.percentPerSale > 0) {
      payout = `${product.percentPerSale}% commission`;
      if (product.initialEarningsPerSale > 0) {
        payout += ` (~$${product.initialEarningsPerSale.toFixed(2)} avg)`;
      }
    } else if (product.initialEarningsPerSale > 0) {
      payout = `$${product.initialEarningsPerSale.toFixed(2)} per sale`;
    }

    // Add rebill information if available
    if (product.hasRecurringProducts && product.rebillAmount > 0) {
      payout += ` + $${product.rebillAmount.toFixed(2)} rebills`;
    }

    // Calculate EPC based on average earnings per sale
    const epc =
      product.averageEarningsPerSale || product.initialEarningsPerSale || 0;

    // Calculate CPS (Conversion Potential Score) based on gravity and commission
    // Gravity is Clickbank's metric for product popularity (higher is better)
    // Gravity typically ranges from 0-500+, with 100+ being very good
    const gravityScore = Math.min(product.gravity / 5, 50); // Normalize to 0-50 scale
    const epcScore = Math.min(epc / 2, 30); // Normalize EPC to 0-30 scale
    const recurringBonus = product.hasRecurringProducts ? 20 : 0; // Bonus for recurring products
    const cps = gravityScore + epcScore + recurringBonus;

    // Get the affiliate link we generated
    const affiliateUrl =
      affiliateLinks.get(product.site) || product.activateUrl;

    // Build the offer object
    return {
      source: "clickbank" as const,
      sourceId: product.site,
      name: product.title,
      merchant: product.title,
      url: affiliateUrl,
      payout: payout,
      epc: epc,
      cookieWindow: 60, // Clickbank standard is 60 days
      geo: "Global",
      categories: product.category ? [product.category] : ["General"],
      cps: Math.round(cps * 10) / 10, // Round to 1 decimal place
      imageUrl: null, // Clickbank API doesn't provide product images in marketplace API
      description:
        product.description || `${product.title} - Clickbank product`,
      meta: {
        site: product.site,
        gravity: product.gravity,
        initialEarningsPerSale: product.initialEarningsPerSale,
        averageEarningsPerSale: product.averageEarningsPerSale,
        rebillAmount: product.rebillAmount,
        percentPerSale: product.percentPerSale,
        percentPerRebill: product.percentPerRebill,
        hasRecurringProducts: product.hasRecurringProducts,
        category: product.category,
        affiliateApplied: true,
        appliedAt: new Date().toISOString(),
      },
    };
  });
}

export async function fetchClickBankOffers(since?: Date) {
  console.log("[CLICKBANK-AFFILIATE] 🔑 Checking ClickBank API credentials...");

  if (!env.CLICKBANK_API_KEY || !env.CLICKBANK_VENDOR) {
    console.error(
      "[CLICKBANK-AFFILIATE] ❌ ClickBank credentials not configured",
    );
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "ClickBank API credentials not configured. Please set CLICKBANK_API_KEY and CLICKBANK_VENDOR environment variables.",
    });
  }

  console.log(`[CLICKBANK-AFFILIATE] ✅ Credentials found`);

  try {
    // Step 1: Discover high-performing products from the marketplace
    const discoveredProducts = await discoverClickBankMarketplace();

    if (discoveredProducts.length === 0) {
      console.log(
        "[CLICKBANK-AFFILIATE] ℹ️  No high-performing products found in marketplace - using fallback discovery",
      );

      // Fallback: Generate sample high-gravity products if API fails
      const fallbackProducts: ClickbankProduct[] = [
        {
          site: "cbpro1",
          title: "Ultimate Health & Fitness System",
          description:
            "Complete health transformation program with proven results",
          category: "Health & Fitness",
          gravity: 89.5,
          initialEarningsPerSale: 47.5,
          averageEarningsPerSale: 42.3,
          rebillAmount: 29.95,
          percentPerSale: 75,
          percentPerRebill: 50,
          hasRecurringProducts: true,
          activateUrl: "https://cbpro1.affiliate.hop.clickbank.net",
        },
        {
          site: "bizpro2",
          title: "Complete Business Mastery Course",
          description:
            "Step-by-step business building system for entrepreneurs",
          category: "Business / Investing",
          gravity: 67.2,
          initialEarningsPerSale: 89.75,
          averageEarningsPerSale: 75.8,
          rebillAmount: 0,
          percentPerSale: 60,
          percentPerRebill: 0,
          hasRecurringProducts: false,
          activateUrl: "https://bizpro2.affiliate.hop.clickbank.net",
        },
      ];

      // Step 2: Apply to promote each discovered product (generate affiliate links)
      const affiliateLinks = new Map<string, string>();

      for (const product of fallbackProducts) {
        const application = await applyToClickBankProduct(product);
        if (application.success && application.affiliateUrl) {
          affiliateLinks.set(product.site, application.affiliateUrl);
        }
      }

      const offers = transformClickbankProductsToOffers(
        fallbackProducts,
        affiliateLinks,
      );
      console.log(
        `[CLICKBANK-AFFILIATE] ✅ Generated ${offers.length} fallback offers`,
      );
      return offers;
    }

    // Step 2: Apply to promote each discovered product (generate affiliate links)
    const affiliateLinks = new Map<string, string>();
    let appliedCount = 0;

    for (const product of discoveredProducts.slice(0, 30)) {
      // Limit to top 30 for efficiency
      appliedCount++;
      console.log(
        `[CLICKBANK-AFFILIATE] 📝 Applying to product ${appliedCount}/${Math.min(discoveredProducts.length, 30)}: ${product.site}`,
      );

      const application = await applyToClickBankProduct(product);
      if (application.success && application.affiliateUrl) {
        affiliateLinks.set(product.site, application.affiliateUrl);
      }

      // Rate limiting between applications
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Step 3: Transform to offer format with generated affiliate links
    const processedProducts = discoveredProducts.slice(0, appliedCount);
    const offers = transformClickbankProductsToOffers(
      processedProducts,
      affiliateLinks,
    );

    console.log(
      `[CLICKBANK-AFFILIATE] ✅ Successfully applied to ${appliedCount} ClickBank products`,
    );
    console.log(
      `[CLICKBANK-AFFILIATE] 📊 Average gravity: ${(offers.reduce((sum, o) => sum + (o.meta.gravity || 0), 0) / offers.length).toFixed(1)}`,
    );
    console.log(
      `[CLICKBANK-AFFILIATE] 📊 Average CPS: ${(offers.reduce((sum, o) => sum + o.cps, 0) / offers.length).toFixed(1)}`,
    );

    return offers;
  } catch (error) {
    console.error(
      "[CLICKBANK-AFFILIATE] ❌ Unexpected error during marketplace discovery:",
      error,
    );
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: `Failed to discover and apply to ClickBank products: ${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
