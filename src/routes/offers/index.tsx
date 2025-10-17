import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRequireAuth } from "~/lib/auth";
import toast from "react-hot-toast";
import {
  Target,
  Filter,
  Search,
  Grid3x3,
  List,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Clock,
  Globe,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/offers/")({
  component: OffersPage,
});

function OffersPage() {
  const { user, loading } = useRequireAuth();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [minCps, setMinCps] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"cps" | "epc" | "payout" | "createdAt">("cps");

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

  const syncOffersMutation = useMutation(
    trpc.offers.sync.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Successfully synced ${data.added + data.updated} offers from ${data.source.toUpperCase()} (${data.added} new, ${data.updated} updated)`,
          { duration: 5000 }
        );
        // Invalidate and refetch offers
        queryClient.invalidateQueries({ queryKey: trpc.offers.list.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.offers.stats.queryKey() });
      },
      onError: (error) => {
        toast.error(`Failed to sync offers: ${error.message}`, { duration: 5000 });
      },
    })
  );

  const handleSyncOffers = () => {
    // For now, we'll sync Awin by default
    // In the future, this could be enhanced with a dropdown to select the source
    syncOffersMutation.mutate({
      source: "awin",
      since: undefined,
    });
  };

  const offersQuery = useQuery(
    trpc.offers.list.queryOptions({
      limit: 20,
      offset: 0,
      source: selectedSource || undefined,
      category: selectedCategory || undefined,
      minCps: minCps > 0 ? minCps : undefined,
      search: searchQuery || undefined,
      sortBy,
      sortOrder: "desc",
    }),
  );

  const statsQuery = useQuery(trpc.offers.stats.queryOptions());

  const offers = offersQuery.data?.offers || [];
  const stats = statsQuery.data;

  // Extract unique categories from offers
  const categories = Array.from(
    new Set(offers.flatMap((offer) => offer.categories)),
  );

  const sources = ["awin", "cj", "clickbank", "impact", "shareasale", "rakuten", "amazon"];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Offers
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Discover and rank high-converting affiliate offers
            </p>
          </div>
          <button 
            onClick={handleSyncOffers}
            disabled={syncOffersMutation.isPending}
            className="flex items-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${syncOffersMutation.isPending ? 'animate-spin' : ''}`} />
            <span>{syncOffersMutation.isPending ? 'Syncing...' : 'Sync Offers'}</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total Offers
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.total || 0}
                </p>
              </div>
              <Target className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg CPS
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.averageCps.toFixed(1) || "0"}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-success-600 dark:text-success-400" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Avg EPC
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  ${stats?.averageEpc.toFixed(2) || "0"}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-warning-600 dark:text-warning-400" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Networks
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats?.bySource.length || 0}
                </p>
              </div>
              <Globe className="h-8 w-8 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search offers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 pl-10 pr-4 text-sm"
                />
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source
              </label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
              >
                <option value="">All Sources</option>
                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 py-2 px-3 text-sm"
              >
                <option value="cps">CPS Score</option>
                <option value="epc">EPC</option>
                <option value="payout">Payout</option>
                <option value="createdAt">Recently Added</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {offers.length} offers found
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode("grid")}
                className={`rounded-lg p-2 ${viewMode === "grid" ? "bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <Grid3x3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`rounded-lg p-2 ${viewMode === "list" ? "bg-primary-100 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Offers Grid/List */}
        {viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={offer.imageUrl || "https://images.unsplash.com/photo-1557821552-17105176677c?w=800"}
                    alt={offer.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-900 shadow-lg">
                      <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                        {offer.cps.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="inline-flex items-center rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-gray-900 dark:text-white">
                      {offer.source.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2">
                    {offer.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {offer.merchant}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2 mb-4">
                    {offer.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Payout</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {offer.payout}
                      </span>
                    </div>
                    {offer.epc && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">EPC</span>
                        <span className="font-semibold text-success-600 dark:text-success-500">
                          ${offer.epc.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {offer.cookieWindow && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          Cookie
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {offer.cookieWindow}d
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {offer.categories.slice(0, 3).map((category) => (
                      <span
                        key={category}
                        className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-400"
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors w-full"
                  >
                    <span>View Offer</span>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <img
                    src={offer.imageUrl || "https://images.unsplash.com/photo-1557821552-17105176677c?w=200"}
                    alt={offer.name}
                    className="h-24 w-24 rounded-lg object-cover flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {offer.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {offer.merchant}
                        </p>
                      </div>
                      <div className="ml-4 flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            CPS Score
                          </p>
                          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                            {offer.cps.toFixed(1)}
                          </p>
                        </div>
                        <a
                          href={offer.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700 transition-colors"
                        >
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      </div>
                    </div>

                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {offer.description}
                    </p>

                    <div className="mt-4 flex items-center flex-wrap gap-4">
                      <div className="flex items-center space-x-1 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          Payout:
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {offer.payout}
                        </span>
                      </div>

                      {offer.epc && (
                        <div className="flex items-center space-x-1 text-sm">
                          <TrendingUp className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            EPC:
                          </span>
                          <span className="font-semibold text-success-600 dark:text-success-500">
                            ${offer.epc.toFixed(2)}
                          </span>
                        </div>
                      )}

                      {offer.cookieWindow && (
                        <div className="flex items-center space-x-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">
                            Cookie:
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {offer.cookieWindow} days
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-1 text-sm">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {offer.geo || "Global"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {offer.source.toUpperCase()}
                      </span>
                      {offer.categories.map((category) => (
                        <span
                          key={category}
                          className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/20 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:text-primary-400"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {offers.length === 0 && (
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-12 text-center">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
              No offers found
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
