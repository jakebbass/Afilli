import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useTRPC } from "~/trpc/react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { 
  Activity, 
  Chrome,
  Key,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  DollarSign,
  Users,
  Mail,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Database,
  Globe,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/activity/")({
  component: ActivityPage,
});

function TaskStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
    running: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: RefreshCw },
    completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
    failed: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TaskTypeIcon({ type }: { type: string }) {
  const iconMap: Record<string, any> = {
    offer_sync: DollarSign,
    offer_scoring: DollarSign,
    lead_discovery: Search,
    lead_list_building: Users,
    lead_enrichment: Database,
    web_search: Globe,
    content_analysis: Globe,
    outreach_generation: Mail,
    offer_optimization: Zap,
    seo_optimization: Zap,
  };

  const Icon = iconMap[type] || Activity;
  return <Icon className="h-4 w-4" />;
}

function TaskActivityIndicators({ task }: { task: any }) {
  const usesPlaywright = ['lead_discovery', 'web_search', 'content_analysis', 'lead_list_building'].includes(task.type);
  const usesApiKey = ['offer_sync', 'offer_scoring', 'lead_enrichment'].includes(task.type);

  return (
    <div className="flex items-center gap-2">
      {usesPlaywright && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          <Chrome className="h-3 w-3" />
          Browser
        </span>
      )}
      {usesApiKey && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Key className="h-3 w-3" />
          API
        </span>
      )}
    </div>
  );
}

function TaskDetailPanel({ task }: { task: any }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTimestamp = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getDuration = () => {
    if (!task.startedAt) return null;
    const start = new Date(task.startedAt).getTime();
    const end = task.completedAt ? new Date(task.completedAt).getTime() : Date.now();
    const durationMs = end - start;
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Task Details
        </span>
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-400" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 space-y-4">
          {/* Timing Information */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Timing
            </h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Created:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatTimestamp(task.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Started:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatTimestamp(task.startedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{formatTimestamp(task.completedAt)}</span>
              </div>
              {getDuration() && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                  <span className="ml-2 text-gray-900 dark:text-white">{getDuration()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Input */}
          {task.input && Object.keys(task.input).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Input
              </h4>
              <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs overflow-x-auto">
                {JSON.stringify(task.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {task.output && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Output
              </h4>
              <pre className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs overflow-x-auto">
                {JSON.stringify(task.output, null, 2)}
              </pre>
            </div>
          )}

          {/* Error */}
          {task.error && (
            <div>
              <h4 className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">
                Error
              </h4>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-700 dark:text-red-400">
                {task.error}
              </div>
            </div>
          )}

          {/* Activity Indicators */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Resources Used
            </h4>
            <div className="flex flex-wrap gap-2">
              {['lead_discovery', 'web_search', 'content_analysis', 'lead_list_building'].includes(task.type) && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <Chrome className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  <div className="text-sm">
                    <div className="font-medium text-purple-900 dark:text-purple-100">Playwright Browser</div>
                    <div className="text-xs text-purple-600 dark:text-purple-400">Headless Chromium used for web scraping</div>
                  </div>
                </div>
              )}
              {task.type === 'offer_sync' && task.output?.sources && (
                <>
                  {task.output.sources.awin > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div className="text-sm">
                        <div className="font-medium text-amber-900 dark:text-amber-100">AWIN API</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">{task.output.sources.awin} offers fetched</div>
                      </div>
                    </div>
                  )}
                  {task.output.sources.cj > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div className="text-sm">
                        <div className="font-medium text-amber-900 dark:text-amber-100">CJ Affiliate API</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">{task.output.sources.cj} offers fetched</div>
                      </div>
                    </div>
                  )}
                  {task.output.sources.clickbank > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <div className="text-sm">
                        <div className="font-medium text-amber-900 dark:text-amber-100">ClickBank API</div>
                        <div className="text-xs text-amber-600 dark:text-amber-400">{task.output.sources.clickbank} offers fetched</div>
                      </div>
                    </div>
                  )}
                </>
              )}
              {task.type === 'lead_enrichment' && (
                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <Key className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <div className="text-sm">
                    <div className="font-medium text-amber-900 dark:text-amber-100">Clay API</div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">Lead enrichment service</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityPage() {
  const trpc = useTRPC();
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const agentsQuery = useQuery(trpc.agents.list.queryOptions());

  // Get all tasks across all agents
  const allTasksQuery = useQuery({
    queryKey: ['all-agent-tasks', selectedAgentId, statusFilter],
    queryFn: async () => {
      const agents = agentsQuery.data || [];
      const agentIds = selectedAgentId ? [selectedAgentId] : agents.map(a => a.id);
      
      const taskPromises = agentIds.map(agentId =>
        trpc.agents.tasks.query({
          agentId,
          status: statusFilter as any,
          limit: 50,
        })
      );

      const results = await Promise.all(taskPromises);
      
      // Flatten and sort by creation date
      const allTasks = results.flatMap((result, index) =>
        result.tasks.map(task => ({
          ...task,
          agentName: agents.find(a => a.id === agentIds[index])?.name || 'Unknown',
          agentType: agents.find(a => a.id === agentIds[index])?.type || 'unknown',
        }))
      );

      return allTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    },
    enabled: !!agentsQuery.data,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Activity Monitor
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Real-time monitoring of agent activities, API usage, and browser automation
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Chrome className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Browser Sessions</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allTasksQuery.data?.filter(t => 
                    ['lead_discovery', 'web_search', 'content_analysis', 'lead_list_building'].includes(t.type) &&
                    t.status === 'completed'
                  ).length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">API Calls</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allTasksQuery.data?.filter(t => 
                    ['offer_sync', 'lead_enrichment'].includes(t.type) &&
                    t.status === 'completed'
                  ).length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allTasksQuery.data?.filter(t => t.status === 'completed').length || 0}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Running</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {allTasksQuery.data?.filter(t => t.status === 'running').length || 0}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={selectedAgentId || ""}
            onChange={(e) => setSelectedAgentId(e.target.value || undefined)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">All Agents</option>
            {agentsQuery.data?.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Activity Log */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
              {allTasksQuery.isRefetching && (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </h2>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-800">
            {allTasksQuery.data?.map((task) => (
              <div key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                        <TaskTypeIcon type={task.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            {task.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </h3>
                          <TaskStatusBadge status={task.status} />
                          <TaskActivityIndicators task={task} />
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>Agent: {task.agentName}</span>
                          <span>•</span>
                          <span>{new Date(task.createdAt).toLocaleString()}</span>
                          {task.output && (
                            <>
                              <span>•</span>
                              {task.output.leadsDiscovered && (
                                <span className="text-green-600 dark:text-green-400">
                                  {task.output.leadsDiscovered} leads discovered
                                </span>
                              )}
                              {task.output.savedOffers && (
                                <span className="text-green-600 dark:text-green-400">
                                  {task.output.savedOffers} offers synced
                                </span>
                              )}
                              {task.output.leadsEnriched && (
                                <span className="text-green-600 dark:text-green-400">
                                  {task.output.leadsEnriched} leads enriched
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <TaskDetailPanel task={task} />
              </div>
            ))}

            {allTasksQuery.data?.length === 0 && (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                  No activity yet
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Start an agent to see activity logs here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
