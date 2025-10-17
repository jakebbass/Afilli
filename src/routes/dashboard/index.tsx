import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { KPICard } from "~/components/KPICard";
import { StatCard } from "~/components/StatCard";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  MousePointerClick,
  Target,
  TrendingUp,
  Users,
  Zap,
  ExternalLink,
  ArrowRight,
  Mail,
  MailOpen,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/")({
  component: Dashboard,
});

function Dashboard() {
  const trpc = useTRPC();
  const dashboardQuery = useQuery(trpc.campaigns.dashboardStats.queryOptions());
  const emailStatsQuery = useQuery(trpc.emails.globalStats.queryOptions({ days: 30 }));

  const stats = dashboardQuery.data;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Welcome back! Here's what's happening with your campaigns.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Revenue"
            value={stats?.totalRevenue || 0}
            format="currency"
            change={12.5}
            trend="up"
            icon={<DollarSign className="h-6 w-6" />}
          />
          <KPICard
            title="Click-Through Rate"
            value={stats?.ctr || 0}
            format="percentage"
            change={8.3}
            trend="up"
            icon={<MousePointerClick className="h-6 w-6" />}
          />
          <KPICard
            title="Conversion Rate"
            value={stats?.cvr || 0}
            format="percentage"
            change={-2.1}
            trend="down"
            icon={<Target className="h-6 w-6" />}
          />
          <KPICard
            title="Active Campaigns"
            value={stats?.activeCampaigns || 0}
            change={5.0}
            trend="up"
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Email Performance */}
        {emailStatsQuery.data && emailStatsQuery.data.totalSent > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Email Outreach Performance
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Emails Sent"
                value={emailStatsQuery.data.totalSent}
                icon={Mail}
                trend={0}
              />
              <StatCard
                title="Open Rate"
                value={`${emailStatsQuery.data.openRate.toFixed(1)}%`}
                icon={MailOpen}
                trend={0}
              />
              <StatCard
                title="Click Rate"
                value={`${emailStatsQuery.data.clickRate.toFixed(1)}%`}
                icon={MousePointerClick}
                trend={0}
              />
              <StatCard
                title="Total Opens"
                value={emailStatsQuery.data.totalOpens}
                icon={TrendingUp}
                trend={0}
              />
            </div>
          </div>
        )}

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Top Offers */}
          <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Top Performing Offers
                </h2>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Ranked by Conversion Potential Score
                </p>
              </div>
              <Link
                to="/offers"
                className="flex items-center space-x-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                <span>View all</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {stats?.topOffers.slice(0, 5).map((offer) => (
                <div
                  key={offer.id}
                  className="flex items-center space-x-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <img
                    src={offer.imageUrl || "https://images.unsplash.com/photo-1557821552-17105176677c?w=200"}
                    alt={offer.name}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {offer.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {offer.merchant}
                    </p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Target className="mr-1 h-3 w-3" />
                        CPS: {offer.cps.toFixed(1)}
                      </span>
                      {offer.epc && (
                        <span className="flex items-center">
                          <DollarSign className="mr-1 h-3 w-3" />
                          EPC: ${offer.epc.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/20 text-success-700 dark:text-success-400 text-xs font-bold">
                      {offer.cps.toFixed(0)}
                    </div>
                    <a
                      href={offer.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Personas */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Top Personas
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                By campaign count
              </p>
            </div>

            <div className="space-y-4">
              {stats?.topPersonas.map((persona) => (
                <Link
                  key={persona.id}
                  to="/personas/$personaId"
                  params={{ personaId: persona.id }}
                  className="block rounded-lg border border-gray-200 dark:border-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {persona.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {persona.description}
                      </p>
                    </div>
                    <div className="ml-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 text-sm font-bold">
                      {persona._count.campaigns}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-2">
                    <StatCard
                      label="Audience"
                      value={persona.audienceSizeEst?.toLocaleString() || "N/A"}
                      icon={<Users className="h-4 w-4" />}
                      color="primary"
                    />
                  </div>
                </Link>
              ))}
            </div>

            <Link
              to="/personas"
              className="mt-4 flex items-center justify-center space-x-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <span>View all personas</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Campaign Results
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Latest performance metrics across all channels
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="pb-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Channel
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sent/Impressions
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Clicks
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    CTR
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Conversions
                  </th>
                  <th className="pb-3 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {stats?.recentResults.map((result, index) => {
                  const metrics = result.metrics as any;
                  return (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 text-sm font-medium text-gray-900 dark:text-white">
                        <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/20 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-400">
                          {result.channel}
                        </span>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {(metrics.sent || metrics.impressions || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {(metrics.clicks || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                        {((metrics.ctr || 0) * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 text-right text-sm text-gray-600 dark:text-gray-400">
                        {(metrics.conversions || 0).toLocaleString()}
                      </td>
                      <td className="py-3 text-right text-sm font-semibold text-success-600 dark:text-success-500">
                        ${(metrics.revenue || 0).toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/campaigns/new"
            className="flex items-center justify-between rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Create Campaign
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Launch a new campaign
              </p>
            </div>
            <Zap className="h-8 w-8 text-gray-400" />
          </Link>

          <Link
            to="/offers"
            className="flex items-center justify-between rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Browse Offers
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Discover new products
              </p>
            </div>
            <Target className="h-8 w-8 text-gray-400" />
          </Link>

          <Link
            to="/personas"
            className="flex items-center justify-between rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Manage Personas
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update targeting
              </p>
            </div>
            <Users className="h-8 w-8 text-gray-400" />
          </Link>

          <Link
            to="/settings"
            className="flex items-center justify-between rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                Sync Offers
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update from networks
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-gray-400" />
          </Link>
        </div>
      </div>
    </Layout>
  );
}
