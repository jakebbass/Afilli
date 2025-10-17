import { z } from "zod";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../main";
import { db } from "../../db";
import { env } from "../../env";

// Initialize Stripe only if keys are configured
let stripe: Stripe | null = null;
if (env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia",
  });
}

// Helper to ensure Stripe is configured
function ensureStripe(): Stripe {
  if (!stripe) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables.",
    });
  }
  return stripe;
}

/**
 * Create a Stripe checkout session for subscription purchase
 */
export const createCheckoutSession = protectedProcedure
  .input(
    z.object({
      priceId: z.string(),
      successUrl: z.string().optional(),
      cancelUrl: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const stripeClient = ensureStripe();
    
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    const baseUrl = env.BASE_URL || "http://localhost:3000";
    const successUrl = input.successUrl || `${baseUrl}/billing?success=true`;
    const cancelUrl = input.cancelUrl || `${baseUrl}/billing?canceled=true`;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: input.priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: ctx.userId,
      },
    };

    // If user already has a Stripe customer ID, use it
    if (user.stripeCustomerId) {
      sessionParams.customer = user.stripeCustomerId;
    } else {
      // Otherwise, create a new customer
      sessionParams.customer_email = user.email;
    }

    const session = await stripeClient.checkout.sessions.create(sessionParams);

    return {
      sessionId: session.id,
      url: session.url,
    };
  });

/**
 * Create a Stripe billing portal session for managing subscription
 */
export const createPortalSession = protectedProcedure
  .input(
    z.object({
      returnUrl: z.string().optional(),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const stripeClient = ensureStripe();
    
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
    });

    if (!user?.stripeCustomerId) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No subscription found. Please subscribe first.",
      });
    }

    const baseUrl = env.BASE_URL || "http://localhost:3000";
    const returnUrl = input.returnUrl || `${baseUrl}/billing`;

    const session = await stripeClient.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return {
      url: session.url,
    };
  });

/**
 * Get the current user's subscription information
 */
export const getSubscription = protectedProcedure.query(async ({ ctx }) => {
  const user = await db.user.findUnique({
    where: { id: ctx.userId },
  });

  if (!user) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  // If no Stripe subscription, return free tier info
  if (!user.stripeSubscriptionId) {
    return {
      subscription: user.subscription,
      status: "free",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  // If Stripe is not configured, return stored subscription info
  if (!stripe) {
    return {
      subscription: user.subscription,
      status: "active",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }

  // Fetch subscription details from Stripe
  try {
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );

    return {
      subscription: user.subscription,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  } catch (error) {
    console.error("Error fetching Stripe subscription:", error);
    // If subscription not found in Stripe, clear it from database
    await db.user.update({
      where: { id: ctx.userId },
      data: {
        stripeSubscriptionId: null,
        subscription: "free",
      },
    });

    return {
      subscription: "free",
      status: "free",
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };
  }
});

/**
 * Get subscription plans with pricing
 */
export const getPlans = protectedProcedure.query(async () => {
  // Return predefined plans
  // In production, you would fetch these from Stripe
  return {
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        interval: "month",
        features: [
          "10 offers synced/day",
          "1 agent",
          "50 leads",
          "Email support",
        ],
        limits: {
          offers: 10,
          agents: 1,
          leads: 50,
        },
      },
      {
        id: "pro",
        name: "Pro",
        price: 49,
        interval: "month",
        priceId: process.env.STRIPE_PRO_PRICE_ID || "",
        features: [
          "Unlimited offers",
          "5 agents",
          "1,000 leads",
          "Priority support",
        ],
        limits: {
          offers: -1, // unlimited
          agents: 5,
          leads: 1000,
        },
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 199,
        interval: "month",
        priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || "",
        features: [
          "Unlimited everything",
          "Custom agents",
          "Dedicated support",
          "API access",
        ],
        limits: {
          offers: -1, // unlimited
          agents: -1, // unlimited
          leads: -1, // unlimited
        },
      },
    ],
  };
});
