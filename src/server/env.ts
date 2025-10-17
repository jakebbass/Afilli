import { z } from "zod";

// Helper to convert empty strings to undefined for optional fields
const preprocessEmptyString = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.string().optional()
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
  SENDGRID_API_KEY: z.string(),
  
  // Social Media (optional - not configured)
  TWITTER_API_KEY: preprocessEmptyString,
  TWITTER_API_SECRET: preprocessEmptyString,
  TWITTER_ACCESS_TOKEN: preprocessEmptyString,
  TWITTER_ACCESS_SECRET: preprocessEmptyString,
  
  // Affiliate Networks
  AWIN_API_TOKEN: z.string(),
  AWIN_PUBLISHER_ID: z.string(),
  
  // CJ Affiliate
  CJ_API_KEY: z.string(),
  CJ_WEBSITE_ID: z.string(),
  
  // Clickbank
  CLICKBANK_API_KEY: z.string(),
  CLICKBANK_CLERK_KEY: z.string(),
  CLICKBANK_VENDOR: z.string(),
  
  // Clay (Data Enrichment)
  CLAY_API_KEY: z.string(),
  
  // Analytics
  POSTHOG_API_KEY: z.string(),
  POSTHOG_HOST: z.string(),
  
  // Redis
  REDIS_URL: z.string().default("redis://redis:6379"),
});

export const env = envSchema.parse(process.env);
