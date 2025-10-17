import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useRequireAuth } from "~/lib/auth";
import { 
  Users, 
  Mail,
  Phone,
  Globe,
  Building2,
  TrendingUp,
  Eye,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  MailOpen,
  MousePointerClick,
  AlertCircle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { StatCard } from "~/components/StatCard";
import toast from "react-hot-toast";

export const Route = createFileRoute("/leads/")({
  component: LeadsPage,
});

function LeadStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    discovered: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Eye },
    contacted: { color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Mail },
    responded: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: TrendingUp },
    converted: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    unqualified: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: XCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.discovered;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function EmailStatusBadge({ status }: { status: string }) {
  const statusConfig = {
    pending: { color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: Clock },
    sent: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Send },
    delivered: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
    opened: { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", icon: MailOpen },
    clicked: { color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: MousePointerClick },
    bounced: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertCircle },
    failed: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.sent;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
      <Icon className="h-3.5 w-3.5" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function LeadDetailsModal({ 
  leadId, 
  onClose 
}: { 
  leadId: string | null; 
  onClose: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  // Always call hooks at the top level - use enabled flag to conditionally fetch
  const leadQuery = useQuery({
    ...trpc.leads.get.queryOptions({ id: leadId || "" }),
    enabled: !!leadId,
  });

  const emailsQuery = useQuery({
    ...trpc.emails.listLeadEmails.queryOptions({ leadId: leadId || "", limit: 10 }),
    enabled: !!leadId,
  });

  const emailStatsQuery = useQuery({
    ...trpc.emails.getStats.queryOptions({ leadId: leadId || "" }),
    enabled: !!leadId,
  });

  const enrichMutation = useMutation(
    trpc.clay.enrichLead.mutationOptions({
      onSuccess: () => {
        toast.success("Lead enriched successfully with Clay!");
        if (leadId) {
          queryClient.invalidateQueries({ queryKey: trpc.leads.get.queryKey({ id: leadId }) });
          queryClient.invalidateQueries({ queryKey: trpc.leads.list.queryKey() });
        }
      },
      onError: (error) => {
        toast.error(`Failed to enrich lead: ${error.message}`);
      },
    })
  );

  const findEmailMutation = useMutation(
    trpc.clay.findEmail.mutationOptions({
      onSuccess: (data) => {
        if (data.email) {
          toast.success(`Email found: ${data.email}`);
        } else {
          toast.error("Could not find email address");
        }
        if (leadId) {
          queryClient.invalidateQueries({ queryKey: trpc.leads.get.queryKey({ id: leadId }) });
          queryClient.invalidateQueries({ queryKey: trpc.leads.list.queryKey() });
        }
      },
      onError: (error) => {
        toast.error(`Failed to find email: ${error.message}`);
      },
    })
  );

  // Early return after all hooks are called
  if (!leadId || !leadQuery.data) return null;

  const lead = leadQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Lead Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.company && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{lead.company}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{lead.phone}</span>
                </div>
              )}
              {lead.sourceUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-gray-400" />
                  <a 
                    href={lead.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 dark:text-primary-400 hover:underline truncate"
                  >
                    View Source
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Interests */}
          {lead.interests.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Interests
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pain Points */}
          {lead.painPoints.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Pain Points
              </h3>
              <div className="flex flex-wrap gap-2">
                {lead.painPoints.map((painPoint, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-sm"
                  >
                    {painPoint}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Offers */}
          {lead.offers && lead.offers.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Recommended Offers
              </h3>
              <div className="space-y-3">
                {lead.offers.map((offer) => (
                  <div
                    key={offer.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {offer.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {offer.merchant}
                        </p>
                      </div>
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                        {offer.payout}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Outreach Status
            </h3>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div>
                <LeadStatusBadge status={lead.outreachStatus} />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Outreach attempts: {lead.outreachAttempts}
                </p>
              </div>
              {lead.lastContactedAt && (
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Last contacted</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(lead.lastContactedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Email Tracking */}
          {emailStatsQuery.data && emailStatsQuery.data.totalSent > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Email Outreach
              </h3>
              
              {/* Email Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {emailStatsQuery.data.totalSent}
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-300">Sent</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {emailStatsQuery.data.openRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-300">Open Rate</div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                    {emailStatsQuery.data.clickRate.toFixed(1)}%
                  </div>
                  <div className="text-xs text-purple-600 dark:text-purple-300">Click Rate</div>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">
                    {emailStatsQuery.data.totalOpens}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-300">Total Opens</div>
                </div>
              </div>

              {/* Email List */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recent Emails
                </h4>
                {emailsQuery.data?.emails.map((email) => (
                  <div
                    key={email.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                          {email.subject}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Sent {new Date(email.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <EmailStatusBadge status={email.status} />
                    </div>
                    
                    {/* Email Engagement Metrics */}
                    {(email.openCount > 0 || email.clickCount > 0) && (
                      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        {email.openCount > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <MailOpen className="h-3.5 w-3.5" />
                            <span>{email.openCount} open{email.openCount !== 1 ? 's' : ''}</span>
                            {email.firstOpenedAt && (
                              <span className="text-gray-400 dark:text-gray-500">
                                • First: {new Date(email.firstOpenedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        )}
                        {email.clickCount > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <MousePointerClick className="h-3.5 w-3.5" />
                            <span>{email.clickCount} click{email.clickCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Error Message */}
                    {email.errorMessage && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-400">
                        {email.errorMessage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clay Enrichment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Data Enrichment
            </h3>
            
            <div className="space-y-3">
              {/* Enrichment Status */}
              {lead.metadata && typeof lead.metadata === 'object' && 'clayEnrichment' in lead.metadata && (lead.metadata as any).clayEnrichment && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      <div>
                        <p className="font-medium text-green-900 dark:text-green-100">
                          Enriched with Clay
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Last enriched: {new Date((lead.metadata as any).clayEnrichment.enrichedAt).toLocaleDateString()}
                        </p>
                        {(lead.metadata as any).clayEnrichment.confidence && (
                          <p className="text-sm text-green-700 dark:text-green-300">
                            Confidence: {((lead.metadata as any).clayEnrichment.confidence * 100).toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Show enriched data */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {(lead.metadata as any).clayEnrichment.jobTitle && (
                      <div>
                        <span className="text-green-600 dark:text-green-400">Job Title:</span>
                        <span className="ml-2 text-green-900 dark:text-green-100">
                          {(lead.metadata as any).clayEnrichment.jobTitle}
                        </span>
                      </div>
                    )}
                    {(lead.metadata as any).clayEnrichment.location && (
                      <div>
                        <span className="text-green-600 dark:text-green-400">Location:</span>
                        <span className="ml-2 text-green-900 dark:text-green-100">
                          {(lead.metadata as any).clayEnrichment.location}
                        </span>
                      </div>
                    )}
                    {(lead.metadata as any).clayEnrichment.companySize && (
                      <div>
                        <span className="text-green-600 dark:text-green-400">Company Size:</span>
                        <span className="ml-2 text-green-900 dark:text-green-100">
                          {(lead.metadata as any).clayEnrichment.companySize}
                        </span>
                      </div>
                    )}
                    {(lead.metadata as any).clayEnrichment.companyIndustry && (
                      <div>
                        <span className="text-green-600 dark:text-green-400">Industry:</span>
                        <span className="ml-2 text-green-900 dark:text-green-100">
                          {(lead.metadata as any).clayEnrichment.companyIndustry}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Enrichment Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => enrichMutation.mutate({ leadId: leadId! })}
                  disabled={enrichMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  {enrichMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {enrichMutation.isPending ? "Enriching..." : "Enrich with Clay"}
                </button>

                {!lead.email && (
                  <button
                    onClick={() => findEmailMutation.mutate({ leadId: leadId! })}
                    disabled={findEmailMutation.isPending}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {findEmailMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                    {findEmailMutation.isPending ? "Finding..." : "Find Email"}
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Clay will enrich this lead with additional contact information, company data, and social profiles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeadsPage() {
  const { user, loading } = useRequireAuth();
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

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

  const leadsQuery = useQuery(trpc.leads.list.queryOptions({
    outreachStatus: statusFilter as any,
    limit: 50,
    offset: 0,
  }));

  const statsQuery = useQuery(trpc.leads.stats.queryOptions());

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Customer Leads
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Leads discovered and qualified by autonomous agents
            </p>
          </div>
        </div>

        {/* Stats */}
        {statsQuery.data && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Leads"
              value={statsQuery.data.total}
              icon={Users}
              trend={0}
            />
            <StatCard
              title="Recent Leads"
              value={statsQuery.data.recentLeads}
              icon={Clock}
              trend={0}
            />
            <StatCard
              title="Contacted"
              value={statsQuery.data.byStatus.find(s => s.status === 'contacted')?.count || 0}
              icon={Mail}
              trend={0}
            />
            <StatCard
              title="Converted"
              value={statsQuery.data.byStatus.find(s => s.status === 'converted')?.count || 0}
              icon={Target}
              trend={0}
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
            <option value="discovered">Discovered</option>
            <option value="contacted">Contacted</option>
            <option value="responded">Responded</option>
            <option value="converted">Converted</option>
            <option value="unqualified">Unqualified</option>
          </select>
        </div>

        {/* Leads List */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Persona
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Interests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Discovered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {leadsQuery.data?.leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div>
                        {lead.company && (
                          <div className="font-medium text-gray-900 dark:text-white">
                            {lead.company}
                          </div>
                        )}
                        {lead.email && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {lead.email}
                          </div>
                        )}
                        {!lead.company && !lead.email && (
                          <div className="text-sm text-gray-400">
                            No contact info
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <LeadStatusBadge status={lead.outreachStatus} />
                    </td>
                    <td className="px-6 py-4">
                      {lead.persona ? (
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {lead.persona.name}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">
                          No persona
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {lead.interests.slice(0, 2).map((interest, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded text-xs"
                          >
                            {interest}
                          </span>
                        ))}
                        {lead.interests.length > 2 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded text-xs">
                            +{lead.interests.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedLeadId(lead.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {leadsQuery.data?.leads.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                No leads yet
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Agents will automatically discover and qualify leads.
              </p>
            </div>
          )}
        </div>
      </div>

      <LeadDetailsModal
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
      />
    </Layout>
  );
}
