import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { useRequireAuth } from "~/lib/auth";
import { 
  Bot, 
  Play, 
  Pause, 
  Plus, 
  Search,
  TrendingUp,
  Users,
  Zap,
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  UserPlus,
  ListFilter,
  Megaphone,
} from "lucide-react";
import toast from "react-hot-toast";
import { StatCard } from "~/components/StatCard";

export const Route = createFileRoute("/agents/")({
  component: AgentsPage,
});

function AgentStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    idle: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
    working: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: Activity },
    paused: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Pause },
    error: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function AgentTypeBadge({ type }: { type: string }) {
  const typeConfig = {
    researcher: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Search },
    outreach: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: Users },
    optimizer: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: TrendingUp },
    orchestrator: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Zap },
    deal_finder: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: DollarSign },
    persona_writer: { color: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400", icon: UserPlus },
    list_builder: { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", icon: ListFilter },
    marketing_agent: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: Megaphone },
  };

  const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.researcher;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
    </span>
  );
}

function CreateAgentModal({ 
  isOpen, 
  onClose, 
  onSuccess 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [type, setType] = useState<"researcher" | "outreach" | "optimizer" | "orchestrator" | "deal_finder" | "persona_writer" | "list_builder" | "marketing_agent">("deal_finder");
  const [personaId, setPersonaId] = useState("");

  const personasQuery = useQuery(trpc.personas.list.queryOptions());
  const createMutation = useMutation(trpc.agents.create.mutationOptions({
    onSuccess: () => {
      toast.success("Agent created successfully");
      onSuccess();
      onClose();
      setName("");
      setType("deal_finder");
      setPersonaId("");
    },
    onError: (error) => {
      toast.error(`Failed to create agent: ${error.message}`);
    },
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      type,
      personaId: personaId || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Create New Agent
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              placeholder="e.g., Tech Startup Researcher"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Agent Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="deal_finder">Deal-Finder - Find & score best affiliate offers</option>
              <option value="persona_writer">Persona-Writer - Build detailed customer profiles</option>
              <option value="list_builder">List-Builder - Build targeted lead lists with Clay</option>
              <option value="marketing_agent">Marketing-Agent - Create & launch campaigns</option>
              <option value="researcher">Researcher - Finds and qualifies leads</option>
              <option value="outreach">Outreach - Generates personalized messages</option>
              <option value="optimizer">Optimizer - Optimizes offers and SEO</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Persona {type === 'deal_finder' ? '(Optional)' : '(Required for some agents)'}
            </label>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="">No persona assigned</option>
              {personasQuery.data?.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-800 dark:text-blue-300">
              {type === 'deal_finder' && 'Syncs offers from affiliate platforms, scores them based on performance metrics, and maintains a ranked database.'}
              {type === 'persona_writer' && 'Creates detailed customer profiles for top products, monitors campaign performance bi-weekly, and switches underperforming offers.'}
              {type === 'list_builder' && 'Uses Clay API to build targeted lead lists based on personas and enriches them with contact data.'}
              {type === 'marketing_agent' && 'Identifies buying signals, creates targeted campaigns, and launches outreach via email and social channels.'}
              {type === 'orchestrator' && 'Coordinates multiple agents, manages workflows, and ensures optimal resource allocation across the system.'}
              {type === 'researcher' && 'Discovers and qualifies potential leads through web research and content analysis.'}
              {type === 'outreach' && 'Generates and sends personalized outreach messages to qualified leads.'}
              {type === 'optimizer' && 'Continuously optimizes offers and SEO strategies based on performance data.'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? "Creating..." : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AgentsPage() {
  const { user, loading } = useRequireAuth();
  const trpc = useTRPC();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

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

  const agentsQuery = useQuery(trpc.agents.list.queryOptions({
    status: statusFilter as any,
    type: typeFilter as any,
  }));

  const statsQuery = useQuery(trpc.agents.stats.queryOptions());

  const startMutation = useMutation(trpc.agents.start.mutationOptions({
    onSuccess: () => {
      toast.success("Agent started");
      agentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to start agent: ${error.message}`);
    },
  }));

  const stopMutation = useMutation(trpc.agents.stop.mutationOptions({
    onSuccess: () => {
      toast.success("Agent stopped");
      agentsQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Failed to stop agent: ${error.message}`);
    },
  }));

  const handleToggleAgent = (agentId: string, currentStatus: string) => {
    if (currentStatus === 'working') {
      stopMutation.mutate({ id: agentId });
    } else {
      startMutation.mutate({ id: agentId });
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Autonomous Agents
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              AI agents that continuously discover leads, generate outreach, and optimize offers
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Create Agent
          </button>
        </div>

        {/* Stats */}
        {statsQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              label="Total Agents"
              value={statsQuery.data.totalAgents}
              icon={<Bot className="h-5 w-5" />}
            />
            <StatCard
              label="Active Agents"
              value={statsQuery.data.byStatus.find(s => s.status === 'working')?.count || 0}
              icon={<Activity className="h-5 w-5" />}
            />
            <StatCard
              label="Tasks Completed"
              value={statsQuery.data.completedTasks}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label="Success Rate"
              value={`${Math.round(statsQuery.data.successRate)}%`}
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4">
          <select
            value={statusFilter || ""}
            onChange={(e) => setStatusFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="idle">Idle</option>
            <option value="working">Working</option>
            <option value="paused">Paused</option>
            <option value="error">Error</option>
          </select>

          <select
            value={typeFilter || ""}
            onChange={(e) => setTypeFilter(e.target.value || undefined)}
            className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="">All Types</option>
            <option value="researcher">Researcher</option>
            <option value="outreach">Outreach</option>
            <option value="optimizer">Optimizer</option>
          </select>
        </div>

        {/* Agents List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Persona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {agentsQuery.data?.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                          <Bot className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {agent.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <AgentTypeBadge type={agent.type} />
                    </td>
                    <td className="px-6 py-4">
                      <AgentStatusBadge status={agent.status} />
                    </td>
                    <td className="px-6 py-4">
                      {agent.persona ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.persona.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-600">
                          No persona
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {agent._count.tasks} tasks
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {agent.lastRunAt 
                          ? new Date(agent.lastRunAt).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleAgent(agent.id, agent.status)}
                        disabled={startMutation.isPending || stopMutation.isPending}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          agent.status === 'working'
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        }`}
                      >
                        {agent.status === 'working' ? (
                          <>
                            <Pause className="h-4 w-4" />
                            Stop
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Start
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {agentsQuery.data?.length === 0 && (
            <div className="text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No agents yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first autonomous agent.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-5 w-5" />
                Create Agent
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => agentsQuery.refetch()}
      />
    </Layout>
  );
}
