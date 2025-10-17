import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { Users, TrendingUp, Mail, Twitter, Plus, Target } from "lucide-react";

export const Route = createFileRoute("/personas/")({
  component: PersonasPage,
});

function PersonasPage() {
  const trpc = useTRPC();
  const personasQuery = useQuery(trpc.personas.list.queryOptions());

  const personas = personasQuery.data || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Personas
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Manage target audience segments and hypotheses
            </p>
          </div>
          <button className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            <Plus className="h-4 w-4" />
            <span>New Persona</span>
          </button>
        </div>

        {/* Personas Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {personas.map((persona) => {
            const hypotheses = (persona.hypotheses as any[]) || [];
            const channels = (persona.channels as any[]) || [];
            const metrics = persona.metrics as any;

            return (
              <div
                key={persona.id}
                className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                    <Users className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center rounded-full bg-primary-100 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-400">
                    {persona._count.campaigns} campaigns
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {persona.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                  {persona.description}
                </p>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Audience
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {persona.audienceSizeEst?.toLocaleString() || "N/A"}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      CLV
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      ${persona.clvEst?.toFixed(0) || "0"}
                    </p>
                  </div>
                </div>

                {/* Hypotheses */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Top Hypotheses
                  </p>
                  <div className="space-y-2">
                    {hypotheses.slice(0, 2).map((h: any) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                          {h.text}
                        </span>
                        <span className="ml-2 font-medium text-success-600 dark:text-success-500">
                          {(h.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Channels */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {channels.map((channel: string) => (
                    <span
                      key={channel}
                      className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      {channel}
                    </span>
                  ))}
                </div>

                {/* Performance */}
                {metrics && (
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Avg CTR
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(metrics.avgCtr * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        Avg CVR
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {(metrics.avgCvr * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}

                <Link
                  to="/personas/$personaId"
                  params={{ personaId: persona.id }}
                  className="mt-4 block w-full text-center rounded-lg border border-primary-600 px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  View Details
                </Link>
              </div>
            );
          })}
        </div>

        {personas.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              No personas yet
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Create your first persona to start targeting campaigns
            </p>
            <button className="mt-4 inline-flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Create Persona</span>
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
