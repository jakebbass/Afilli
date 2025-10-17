import { z } from "zod";
import "dotenv/config";

// Helper to convert empty strings to undefined for optional fields
const preprocessEmptyString = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]),
  BASE_URL: preprocessEmptyString,
  BASE_URL_OTHER_PORT: preprocessEmptyString,
  ADMIN_PASSWORD: z.string(),
  JWT_SECRET: z.string(),

  // AI/LLM
  OPENROUTER_API_KEY: z.string(),
  OPENAI_API_KEY: preprocessEmptyString, // Optional - using OpenRouter for all AI access

  // Email
  SENDGRID_API_KEY: preprocessEmptyString,

  // Social Media (optional - not configured)
  TWITTER_API_KEY: preprocessEmptyString,
  TWITTER_API_SECRET: preprocessEmptyString,
  TWITTER_ACCESS_TOKEN: preprocessEmptyString,
  TWITTER_ACCESS_SECRET: preprocessEmptyString,

  // Affiliate Networks
  AWIN_API_TOKEN: preprocessEmptyString,
  AWIN_PUBLISHER_ID: preprocessEmptyString,

  // CJ Affiliate
  CJ_API_KEY: preprocessEmptyString,
  CJ_WEBSITE_ID: preprocessEmptyString,

  // Clickbank
  CLICKBANK_API_KEY: preprocessEmptyString,
  CLICKBANK_CLERK_KEY: preprocessEmptyString,
  CLICKBANK_VENDOR: preprocessEmptyString,

  // Clay (Data Enrichment)
  CLAY_API_KEY: preprocessEmptyString,

  // Analytics
  POSTHOG_API_KEY: preprocessEmptyString,
  POSTHOG_HOST: preprocessEmptyString,

  // Stripe
  STRIPE_SECRET_KEY: preprocessEmptyString,
  STRIPE_PUBLISHABLE_KEY: preprocessEmptyString,
  STRIPE_WEBHOOK_SECRET: preprocessEmptyString,

  // Redis
  REDIS_URL: z.string().default("redis://redis:6379"),
});

export const env = envSchema.parse(process.env);
