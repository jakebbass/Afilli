import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useRequireAuth } from "~/lib/auth";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  Check,
  ArrowRight,
  ExternalLink,
  Calendar,
  TrendingUp,
  Users,
  Target,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/billing/")({
  component: BillingPage,
});

function BillingPage() {
  const { user, loading } = useRequireAuth();
  const trpc = useTRPC();

  const subscriptionQuery = useQuery(trpc.stripe.getSubscription.queryOptions());
  const plansQuery = useQuery(trpc.stripe.getPlans.queryOptions());

  const createCheckoutMutation = useMutation(
    trpc.stripe.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error(`Failed to start checkout: ${error.message}`);
      },
    })
  );

  const createPortalMutation = useMutation(
    trpc.stripe.createPortalSession.mutationOptions({
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error) => {
        toast.error(`Failed to open billing portal: ${error.message}`);
      },
    })
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const subscription = subscriptionQuery.data;
  const plans = plansQuery.data?.plans || [];
  const currentPlan = plans.find((p) => p.id === subscription?.subscription);

  const handleUpgrade = (priceId: string) => {
    if (!priceId) {
      toast.error("This plan is not available yet. Please contact support.");
      return;
    }
    createCheckoutMutation.mutate({ priceId });
  };

  const handleManageSubscription = () => {
    createPortalMutation.mutate({});
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Billing & Subscription
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan */}
        {subscription && currentPlan && (
          <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-2">Current Plan</h2>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-bold">{currentPlan.name}</span>
                  {currentPlan.price > 0 && (
                    <span className="text-2xl">
                      ${currentPlan.price}/{currentPlan.interval}
                    </span>
                  )}
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="mt-2 text-primary-100">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    {subscription.cancelAtPeriodEnd
                      ? "Cancels on"
                      : "Renews on"}{" "}
                    {new Date(
                      subscription.currentPeriodEnd * 1000
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div>
                {subscription.subscription !== "free" && (
                  <button
                    onClick={handleManageSubscription}
                    disabled={createPortalMutation.isPending}
                    className="flex items-center space-x-2 px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>Manage Subscription</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <UsageCard
              title="Offers Synced"
              current={45}
              limit={currentPlan?.limits.offers || 10}
              icon={Target}
            />
            <UsageCard
              title="Active Agents"
              current={1}
              limit={currentPlan?.limits.agents || 1}
              icon={Zap}
            />
            <UsageCard
              title="Total Leads"
              current={23}
              limit={currentPlan?.limits.leads || 50}
              icon={Users}
            />
          </div>
        </div>

        {/* Available Plans */}
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Available Plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isCurrentPlan={plan.id === subscription?.subscription}
                onUpgrade={() => handleUpgrade(plan.priceId || "")}
                isLoading={createCheckoutMutation.isPending}
              />
            ))}
          </div>
        </div>

        {/* Billing Information */}
        {subscription?.subscription !== "free" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Billing Information
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              To view your billing history and update payment methods, visit the
              billing portal.
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={createPortalMutation.isPending}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              <span>Open Billing Portal</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

function UsageCard({
  title,
  current,
  limit,
  icon: Icon,
}: {
  title: string;
  current: number;
  limit: number;
  icon: React.ElementType;
}) {
  const percentage = limit === -1 ? 0 : (current / limit) * 100;
  const isUnlimited = limit === -1;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {isUnlimited ? "Unlimited" : `${current} / ${limit}`}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      {!isUnlimited && (
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              percentage > 80
                ? "bg-red-500"
                : percentage > 50
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

function PlanCard({
  plan,
  isCurrentPlan,
  onUpgrade,
  isLoading,
}: {
  plan: {
    id: string;
    name: string;
    price: number;
    interval: string;
    features: string[];
  };
  isCurrentPlan: boolean;
  onUpgrade: () => void;
  isLoading: boolean;
}) {
  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 
        ${isCurrentPlan ? "ring-2 ring-primary-600" : ""}
      `}
    >
      {isCurrentPlan && (
        <div className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-sm font-medium mb-4">
          Current Plan
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
        {plan.name}
      </h3>

      <div className="mb-6">
        <span className="text-4xl font-bold text-gray-900 dark:text-white">
          ${plan.price}
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          /{plan.interval}
        </span>
      </div>

      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start space-x-3">
            <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">{feature}</span>
          </li>
        ))}
      </ul>

      {!isCurrentPlan && (
        <button
          onClick={onUpgrade}
          disabled={isLoading || plan.price === 0}
          className={`
            w-full py-3 rounded-lg font-medium transition-colors
            ${
              plan.price === 0
                ? "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            }
          `}
        >
          {plan.price === 0 ? "Free" : isLoading ? "Processing..." : "Upgrade"}
        </button>
      )}
    </div>
  );
}
