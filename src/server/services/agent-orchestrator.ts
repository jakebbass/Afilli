import { db } from "~/server/db";
import { generateText, generateObject, tool } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { z } from "zod";
import * as webScraper from "./web-scraper";
import * as emailService from "./email-service";
import * as awinAffiliate from "./awin-affiliate";
import * as cjAffiliate from "./cj-affiliate";
import * as clickbankAffiliate from "./clickbank-affiliate";
import * as clayIntegration from "./clay-integration";

export const AGENT_TYPES = {
  RESEARCHER: 'researcher',
  OUTREACH: 'outreach',
  OPTIMIZER: 'optimizer',
  ORCHESTRATOR: 'orchestrator',
  DEAL_FINDER: 'deal_finder',
  PERSONA_WRITER: 'persona_writer',
  LIST_BUILDER: 'list_builder',
  MARKETING_AGENT: 'marketing_agent',
} as const;

export const TASK_TYPES = {
  WEB_SEARCH: 'web_search',
  LEAD_DISCOVERY: 'lead_discovery',
  CONTENT_ANALYSIS: 'content_analysis',
  OUTREACH_GENERATION: 'outreach_generation',
  OFFER_OPTIMIZATION: 'offer_optimization',
  SEO_OPTIMIZATION: 'seo_optimization',
  OFFER_SYNC: 'offer_sync',
  OFFER_SCORING: 'offer_scoring',
  PERSONA_GENERATION: 'persona_generation',
  CAMPAIGN_MONITORING: 'campaign_monitoring',
  OFFER_SWITCHING: 'offer_switching',
  LEAD_LIST_BUILDING: 'lead_list_building',
  LEAD_ENRICHMENT: 'lead_enrichment',
  CAMPAIGN_CREATION: 'campaign_creation',
  BUYING_SIGNAL_ANALYSIS: 'buying_signal_analysis',
  CAMPAIGN_LAUNCH: 'campaign_launch',
} as const;

interface AgentConfig {
  maxConcurrentTasks: number;
  taskInterval: number; // milliseconds
  retryAttempts: number;
}

const DEFAULT_CONFIG: AgentConfig = {
  maxConcurrentTasks: 3,
  taskInterval: 60000, // 1 minute
  retryAttempts: 3,
};

export async function executeResearcherTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { persona: true },
  });

  if (!agent || !agent.persona) {
    throw new Error('Agent or persona not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Update task status
  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};

    switch (task.type) {
      case TASK_TYPES.WEB_SEARCH: {
        // Generate search queries based on persona
        const model = openrouter('anthropic/claude-3.5-sonnet');
        const { text } = await generateText({
          model,
          prompt: `Generate 5 highly specific search queries to find potential customers for this persona:
          
Name: ${agent.persona.name}
Description: ${agent.persona.description}
Signals: ${JSON.stringify(agent.persona.signals)}

Focus on queries that would find:
1. People actively looking for solutions
2. Companies with relevant pain points
3. Decision makers in target industries
4. Communities discussing related topics
5. Content indicating buying intent

Return only the queries, one per line.`,
        });

        const queries = text.split('\n').filter(q => q.trim().length > 0);
        output = { queries, timestamp: new Date() };
        break;
      }

      case TASK_TYPES.LEAD_DISCOVERY: {
        const searchQuery = input.searchQuery || `${agent.persona.name} looking for solutions`;
        const leads = await webScraper.discoverLeads(
          searchQuery,
          agent.persona.id,
          input.maxLeads || 10
        );

        // Save leads to database
        const savedLeads = await Promise.all(
          leads.map(lead =>
            db.customerLead.create({
              data: {
                ...lead,
                personaId: agent.persona!.id,
              },
            })
          )
        );

        output = {
          leadsDiscovered: savedLeads.length,
          leadIds: savedLeads.map(l => l.id),
          searchQuery,
        };
        break;
      }

      case TASK_TYPES.CONTENT_ANALYSIS: {
        const url = input.url;
        const pageData = await webScraper.extractPageContent(url);
        const analysis = await webScraper.analyzeContent(
          pageData.content,
          `${agent.persona.name}: ${agent.persona.description}`
        );

        output = {
          url,
          analysis,
          pageData: {
            title: pageData.title,
            emails: pageData.emails,
            phones: pageData.phones,
          },
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    // Update task as completed
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    // Update agent metrics
    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          lastTaskType: task.type,
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    // Update task as failed
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function executeOutreachTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { persona: true },
  });

  if (!agent || !agent.persona) {
    throw new Error('Agent or persona not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};

    switch (task.type) {
      case TASK_TYPES.OUTREACH_GENERATION: {
        const leadId = input.leadId;
        const lead = await db.customerLead.findUnique({
          where: { id: leadId },
        });

        if (!lead) {
          throw new Error('Lead not found');
        }

        if (!lead.email) {
          throw new Error('Lead has no email address');
        }

        // Get recommended offers for this lead
        const offers = await db.offer.findMany({
          where: {
            id: { in: lead.recommendedOffers },
          },
          take: 3,
        });

        // Generate personalized outreach
        const model = openrouter('anthropic/claude-3.5-sonnet');
        const { text } = await generateText({
          model,
          system: 'You are an expert sales copywriter specializing in personalized outreach that converts.',
          prompt: `Create a highly personalized outreach message for this lead:

Lead Information:
- Company: ${lead.company || 'Unknown'}
- Interests: ${lead.interests.join(', ')}
- Pain Points: ${lead.painPoints.join(', ')}
- Source: ${lead.sourceUrl}

Persona Context:
- ${agent.persona.name}: ${agent.persona.description}

Recommended Offers:
${offers.map(o => `- ${o.name} by ${o.merchant}: ${o.description}`).join('\n')}

Create an email that:
1. References their specific interests and pain points
2. Provides genuine value upfront
3. Naturally introduces the most relevant offer
4. Has a clear, low-friction call-to-action
5. Feels personal, not templated

Format as:
Subject: [subject line]

[email body in HTML format]`,
        });

        // Parse subject and body from generated text
        const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);
        const subject = subjectMatch ? subjectMatch[1].trim() : 'Personalized Recommendation';
        
        // Remove the subject line from the body
        const body = text.replace(/Subject:\s*.+?(?:\n|$)/i, '').trim();

        // Send the email via SendGrid
        const emailResult = await emailService.sendEmail({
          to: lead.email,
          subject,
          body,
          leadId: lead.id,
        });

        output = {
          leadId,
          outreachContent: text,
          subject,
          channel: 'email',
          offersIncluded: offers.map(o => o.id),
          emailSent: emailResult.success,
          emailId: emailResult.emailId,
          emailError: emailResult.error,
        };

        // Update lead status based on email send result
        if (emailResult.success) {
          await db.customerLead.update({
            where: { id: leadId },
            data: {
              outreachAttempts: { increment: 1 },
              outreachStatus: 'contacted',
              lastContactedAt: new Date(),
            },
          });
        } else {
          // Don't update status if email failed to send
          console.error(`Failed to send email to lead ${leadId}:`, emailResult.error);
        }

        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          outreachGenerated: (currentMetrics.outreachGenerated || 0) + 1,
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function executeOptimizerTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { persona: true },
  });

  if (!agent || !agent.persona) {
    throw new Error('Agent or persona not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};

    switch (task.type) {
      case TASK_TYPES.OFFER_OPTIMIZATION: {
        // Get all offers
        const offers = await db.offer.findMany({
          take: 50,
          orderBy: { cps: 'desc' },
        });

        // Get recent leads and their interests
        const recentLeads = await db.customerLead.findMany({
          where: { personaId: agent.persona!.id },
          orderBy: { createdAt: 'desc' },
          take: 20,
        });

        const allInterests = recentLeads.flatMap(l => l.interests);
        const interestCounts = allInterests.reduce((acc, interest) => {
          acc[interest] = (acc[interest] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Use AI to match offers to trending interests
        const model = openrouter('anthropic/claude-3.5-sonnet');
        const { object } = await generateObject({
          model,
          schema: z.object({
            recommendations: z.array(z.object({
              offerId: z.string(),
              score: z.number().min(0).max(100),
              reasoning: z.string(),
            })),
          }),
          prompt: `Analyze these offers and match them to current customer interests:

Top Customer Interests:
${Object.entries(interestCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([interest, count]) => `- ${interest} (${count} mentions)`)
  .join('\n')}

Available Offers:
${offers.slice(0, 20).map(o => `ID: ${o.id}, Name: ${o.name}, Merchant: ${o.merchant}, Categories: ${o.categories.join(', ')}`).join('\n')}

Rank the offers by relevance to current customer interests. Provide a score (0-100) and brief reasoning for each.`,
        });

        // Update offer CPS scores based on recommendations
        for (const rec of object.recommendations) {
          await db.offer.update({
            where: { id: rec.offerId },
            data: {
              cps: rec.score,
              meta: {
                lastOptimized: new Date(),
                optimizationReasoning: rec.reasoning,
              },
            },
          });
        }

        output = {
          offersOptimized: object.recommendations.length,
          topRecommendations: object.recommendations.slice(0, 5),
        };
        break;
      }

      case TASK_TYPES.SEO_OPTIMIZATION: {
        // Analyze what content would rank well in ChatGPT searches
        const model = openrouter('anthropic/claude-3.5-sonnet');
        
        const { text } = await generateText({
          model,
          system: 'You are an SEO expert specializing in optimizing content for AI search engines like ChatGPT.',
          prompt: `Generate SEO optimization recommendations for affiliate offers targeting this persona:

Persona: ${agent.persona!.name}
Description: ${agent.persona!.description}
Signals: ${JSON.stringify(agent.persona!.signals)}

Provide:
1. Keywords that would trigger recommendations in ChatGPT
2. Content topics to create that would rank well
3. Question patterns users would ask that should lead to these offers
4. Metadata and descriptions that would improve discoverability
5. Strategies to appear as top results in AI-powered searches

Focus on making offers the top recommendation when users search for related products in ChatGPT or similar AI assistants.`,
        });

        // Update persona with SEO insights
        await db.persona.update({
          where: { id: agent.persona!.id },
          data: {
            webInsights: {
              seoOptimization: text,
              lastOptimized: new Date(),
            },
          },
        });

        output = {
          personaId: agent.persona!.id,
          seoRecommendations: text,
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          optimizationsRun: (currentMetrics.optimizationsRun || 0) + 1,
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function executeDealFinderTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};
    const config = (agent.config as any) || {};

    switch (task.type) {
      case TASK_TYPES.OFFER_SYNC: {
        // Fetch offers from all configured affiliate platforms
        const allOffers: any[] = [];
        const errors: string[] = [];

        // Fetch from AWIN
        try {
          const awinOffers = await awinAffiliate.fetchAwinOffers();
          allOffers.push(...awinOffers);
        } catch (error: any) {
          errors.push(`AWIN: ${error.message}`);
          console.error('Error fetching AWIN offers:', error);
        }

        // Fetch from CJ
        try {
          const cjOffers = await cjAffiliate.fetchCJOffers();
          allOffers.push(...cjOffers);
        } catch (error: any) {
          errors.push(`CJ: ${error.message}`);
          console.error('Error fetching CJ offers:', error);
        }

        // Fetch from ClickBank
        try {
          const clickbankOffers = await clickbankAffiliate.fetchClickBankOffers();
          allOffers.push(...clickbankOffers);
        } catch (error: any) {
          errors.push(`ClickBank: ${error.message}`);
          console.error('Error fetching ClickBank offers:', error);
        }

        // Upsert offers to database
        const minScore = config.minCpsScore || 50; // Default minimum CPS score
        const savedOffers = [];

        for (const offer of allOffers) {
          // Only save offers that meet the minimum score criteria
          if (offer.cps >= minScore) {
            const saved = await db.offer.upsert({
              where: {
                source_sourceId: {
                  source: offer.source,
                  sourceId: offer.sourceId || offer.name,
                },
              },
              create: offer,
              update: {
                ...offer,
                updatedAt: new Date(),
              },
            });
            savedOffers.push(saved);
          }
        }

        output = {
          totalFetched: allOffers.length,
          savedOffers: savedOffers.length,
          minScoreThreshold: minScore,
          errors: errors.length > 0 ? errors : undefined,
          sources: {
            awin: allOffers.filter(o => o.source === 'awin').length,
            cj: allOffers.filter(o => o.source === 'cj').length,
            clickbank: allOffers.filter(o => o.source === 'clickbank').length,
          },
        };
        break;
      }

      case TASK_TYPES.OFFER_SCORING: {
        // Re-score existing offers based on recent performance and market trends
        const offers = await db.offer.findMany({
          take: 100,
          orderBy: { updatedAt: 'asc' }, // Score oldest first
        });

        const model = openrouter('anthropic/claude-3.5-sonnet');
        const { object } = await generateObject({
          model,
          schema: z.object({
            scores: z.array(z.object({
              offerId: z.string(),
              newCps: z.number().min(0).max(100),
              reasoning: z.string(),
              recommendAction: z.enum(['keep', 'remove', 'promote']),
            })),
          }),
          prompt: `Analyze these affiliate offers and provide updated Conversion Potential Scores (CPS).

Consider:
1. Payout amounts and commission rates
2. Cookie window length (longer is better)
3. EPC (Earnings Per Click) if available
4. Category relevance and market demand
5. Merchant reputation

Offers to score:
${offers.slice(0, 20).map(o => `
ID: ${o.id}
Name: ${o.name}
Merchant: ${o.merchant}
Payout: ${o.payout}
EPC: ${o.epc || 'N/A'}
Cookie Window: ${o.cookieWindow} days
Categories: ${o.categories.join(', ')}
Current CPS: ${o.cps}
`).join('\n---\n')}

Provide a CPS score (0-100) where:
- 0-30: Poor offer, consider removing
- 31-60: Average offer, keep but don't prioritize
- 61-80: Good offer, actively promote
- 81-100: Excellent offer, prioritize heavily

Also recommend an action: keep, remove, or promote.`,
        });

        // Update offer scores
        const updated = [];
        for (const score of object.scores) {
          const updatedOffer = await db.offer.update({
            where: { id: score.offerId },
            data: {
              cps: score.newCps,
              meta: {
                lastScoredAt: new Date(),
                scoringReasoning: score.reasoning,
                recommendedAction: score.recommendAction,
              },
            },
          });
          updated.push(updatedOffer);
        }

        output = {
          offersScored: updated.length,
          averageScore: updated.reduce((sum, o) => sum + o.cps, 0) / updated.length,
          recommendations: {
            keep: object.scores.filter(s => s.recommendAction === 'keep').length,
            remove: object.scores.filter(s => s.recommendAction === 'remove').length,
            promote: object.scores.filter(s => s.recommendAction === 'promote').length,
          },
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          offersSynced: (currentMetrics.offersSynced || 0) + (output.savedOffers || 0),
          lastSyncAt: new Date(),
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function executePersonaWriterTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};
    const config = (agent.config as any) || {};

    switch (task.type) {
      case TASK_TYPES.PERSONA_GENERATION: {
        // Get top performing offers to build personas around
        const topOffers = await db.offer.findMany({
          where: {
            cps: { gte: config.minCpsScore || 60 },
          },
          orderBy: { cps: 'desc' },
          take: config.maxPersonas || 20,
        });

        const model = openrouter('anthropic/claude-3.5-sonnet');
        const createdPersonas = [];

        // Generate detailed personas for top offers
        for (const offer of topOffers) {
          const { object } = await generateObject({
            model,
            schema: z.object({
              name: z.string(),
              description: z.string(),
              hypotheses: z.array(z.string()),
              signals: z.array(z.object({
                signal: z.string(),
                strength: z.enum(['weak', 'medium', 'strong']),
              })),
              channels: z.array(z.string()),
              audienceSizeEst: z.number(),
              clvEst: z.number(),
              searchKeywords: z.array(z.string()),
              targetSites: z.array(z.string()),
            }),
            prompt: `Create a highly detailed ideal customer profile (persona) for this affiliate offer:

Offer: ${offer.name}
Merchant: ${offer.merchant}
Payout: ${offer.payout}
Categories: ${offer.categories.join(', ')}
Description: ${offer.description}

Create a persona that would be most likely to purchase this offer. Include:

1. Name: A descriptive persona name (e.g., "Tech-Savvy Entrepreneur", "Fitness-Focused Millennial")

2. Description: Detailed demographic and psychographic profile (200-300 words)

3. Hypotheses: 5-7 hypotheses about why this persona would buy (specific pain points, desires, goals)

4. Signals: 7-10 buying signals to watch for, each with strength rating:
   - Behavioral signals (e.g., "visited pricing page 3+ times")
   - Intent signals (e.g., "searched for [competitor] alternatives")
   - Engagement signals (e.g., "downloaded whitepaper")

5. Channels: Best marketing channels to reach them (email, twitter, linkedin, facebook, tiktok, chat, seo)

6. Audience Size Estimate: Rough estimate of total addressable market size

7. CLV Estimate: Estimated customer lifetime value in dollars

8. Search Keywords: 10-15 keywords this persona would search for

9. Target Sites: 5-10 websites/communities where this persona hangs out

Be extremely specific and detailed. Think like a master marketer who deeply understands customer psychology.`,
          });

          // Check if persona already exists for this offer
          const existingPersona = await db.persona.findFirst({
            where: {
              name: object.name,
            },
          });

          if (!existingPersona) {
            const persona = await db.persona.create({
              data: {
                name: object.name,
                description: object.description,
                hypotheses: object.hypotheses,
                signals: object.signals,
                channels: object.channels,
                audienceSizeEst: object.audienceSizeEst,
                clvEst: object.clvEst,
                searchKeywords: object.searchKeywords,
                targetSites: object.targetSites,
                webInsights: {
                  linkedOfferId: offer.id,
                  offerName: offer.name,
                  createdByAgent: agentId,
                },
              },
            });
            createdPersonas.push(persona);
          }
        }

        output = {
          personasCreated: createdPersonas.length,
          personaIds: createdPersonas.map(p => p.id),
          offersAnalyzed: topOffers.length,
        };
        break;
      }

      case TASK_TYPES.CAMPAIGN_MONITORING: {
        // Check campaign performance and identify underperforming offers
        const campaigns = await db.campaign.findMany({
          where: {
            status: 'active',
          },
          include: {
            persona: true,
            results: {
              where: {
                ts: {
                  gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Last 14 days
                },
              },
            },
          },
        });

        const performanceAnalysis = [];

        for (const campaign of campaigns) {
          // Calculate performance metrics
          const totalResults = campaign.results.reduce((acc, result) => {
            const metrics = result.metrics as any;
            acc.sent += metrics.sent || 0;
            acc.clicks += metrics.clicks || 0;
            acc.conversions += metrics.conversions || 0;
            acc.revenue += metrics.revenue || 0;
            return acc;
          }, { sent: 0, clicks: 0, conversions: 0, revenue: 0 });

          const ctr = totalResults.sent > 0 ? totalResults.clicks / totalResults.sent : 0;
          const cvr = totalResults.clicks > 0 ? totalResults.conversions / totalResults.clicks : 0;

          // Determine if campaign is underperforming
          const isUnderperforming = ctr < 0.02 || cvr < 0.01 || totalResults.revenue < 100;

          performanceAnalysis.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            personaId: campaign.personaId,
            metrics: totalResults,
            ctr,
            cvr,
            isUnderperforming,
            offerIds: campaign.offerIds,
          });
        }

        output = {
          campaignsMonitored: campaigns.length,
          underperformingCampaigns: performanceAnalysis.filter(c => c.isUnderperforming).length,
          performanceAnalysis: performanceAnalysis.slice(0, 10),
        };
        break;
      }

      case TASK_TYPES.OFFER_SWITCHING: {
        // Find underperforming campaigns and switch out offers
        const underperformingCampaigns = await db.campaign.findMany({
          where: {
            status: 'active',
          },
          include: {
            persona: true,
            results: {
              where: {
                ts: {
                  gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
                },
              },
            },
          },
        });

        const switchedCampaigns = [];

        for (const campaign of underperformingCampaigns) {
          const totalResults = campaign.results.reduce((acc, result) => {
            const metrics = result.metrics as any;
            acc.clicks += metrics.clicks || 0;
            acc.conversions += metrics.conversions || 0;
            return acc;
          }, { clicks: 0, conversions: 0 });

          const cvr = totalResults.clicks > 0 ? totalResults.conversions / totalResults.clicks : 0;

          // If conversion rate is below 1%, switch offers
          if (cvr < 0.01 && totalResults.clicks > 50) {
            // Get better performing offers from same categories
            const currentOffers = await db.offer.findMany({
              where: {
                id: { in: campaign.offerIds },
              },
            });

            const categories = [...new Set(currentOffers.flatMap(o => o.categories))];

            const betterOffers = await db.offer.findMany({
              where: {
                categories: { hasSome: categories },
                cps: { gte: 70 },
                id: { notIn: campaign.offerIds },
              },
              orderBy: { cps: 'desc' },
              take: 3,
            });

            if (betterOffers.length > 0) {
              // Replace lowest performing offer with best new offer
              const newOfferIds = [
                ...campaign.offerIds.slice(0, -1),
                betterOffers[0].id,
              ];

              await db.campaign.update({
                where: { id: campaign.id },
                data: {
                  offerIds: newOfferIds,
                },
              });

              switchedCampaigns.push({
                campaignId: campaign.id,
                removedOffer: campaign.offerIds[campaign.offerIds.length - 1],
                addedOffer: betterOffers[0].id,
              });
            }
          }
        }

        output = {
          campaignsEvaluated: underperformingCampaigns.length,
          offersSwitched: switchedCampaigns.length,
          switches: switchedCampaigns,
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          personasCreated: (currentMetrics.personasCreated || 0) + (output.personasCreated || 0),
          campaignsOptimized: (currentMetrics.campaignsOptimized || 0) + (output.offersSwitched || 0),
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function executeListBuilderTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { persona: true },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};
    const config = (agent.config as any) || {};

    switch (task.type) {
      case TASK_TYPES.LEAD_LIST_BUILDING: {
        if (!agent.persona) {
          throw new Error('Agent must be assigned to a persona');
        }

        // Use web scraper to discover potential leads based on persona
        const searchQuery = input.searchQuery || 
          `${agent.persona.name} ${agent.persona.searchKeywords.slice(0, 3).join(' ')}`;
        
        const discoveredLeads = await webScraper.discoverLeads(
          searchQuery,
          agent.persona.id,
          config.maxLeadsPerRun || 20
        );

        // Save discovered leads
        const savedLeads = await Promise.all(
          discoveredLeads.map(lead =>
            db.customerLead.create({
              data: {
                ...lead,
                personaId: agent.persona!.id,
                outreachStatus: 'discovered',
              },
            })
          )
        );

        output = {
          leadsDiscovered: savedLeads.length,
          leadIds: savedLeads.map(l => l.id),
          searchQuery,
          personaName: agent.persona.name,
        };
        break;
      }

      case TASK_TYPES.LEAD_ENRICHMENT: {
        // Get leads that need enrichment (no email or incomplete data)
        const leadsToEnrich = await db.customerLead.findMany({
          where: {
            personaId: agent.personaId || undefined,
            OR: [
              { email: null },
              { company: null },
              { phone: null },
            ],
          },
          orderBy: { createdAt: 'desc' },
          take: config.maxEnrichPerRun || 10,
        });

        const enrichedLeads = [];
        const errors: string[] = [];

        for (const lead of leadsToEnrich) {
          try {
            // Enrich lead with Clay
            const enrichmentData = await clayIntegration.enrichLeadWithClay({
              name: lead.name || undefined,
              company: lead.company || undefined,
              website: lead.website || undefined,
              email: lead.email || undefined,
            });

            // Update lead with enriched data
            const updatedLead = await db.customerLead.update({
              where: { id: lead.id },
              data: {
                email: enrichmentData.email || lead.email,
                phone: enrichmentData.phone || lead.phone,
                company: enrichmentData.companyName || lead.company,
                website: enrichmentData.companyWebsite || lead.website,
                metadata: {
                  ...(lead.metadata as any || {}),
                  clayEnrichment: {
                    enrichedAt: new Date(),
                    confidence: enrichmentData.confidence,
                    jobTitle: enrichmentData.jobTitle,
                    location: enrichmentData.location,
                    companySize: enrichmentData.companySize,
                    companyIndustry: enrichmentData.companyIndustry,
                    technologies: enrichmentData.technologies,
                    linkedinUrl: enrichmentData.linkedinUrl,
                    twitterUrl: enrichmentData.twitterUrl,
                  },
                },
              },
            });

            enrichedLeads.push(updatedLead);
          } catch (error: any) {
            errors.push(`Lead ${lead.id}: ${error.message}`);
            console.error(`Error enriching lead ${lead.id}:`, error);
          }
        }

        output = {
          leadsEnriched: enrichedLeads.length,
          leadIds: enrichedLeads.map(l => l.id),
          errors: errors.length > 0 ? errors : undefined,
          successRate: leadsToEnrich.length > 0 
            ? (enrichedLeads.length / leadsToEnrich.length) * 100 
            : 0,
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          leadsBuilt: (currentMetrics.leadsBuilt || 0) + (output.leadsDiscovered || 0),
          leadsEnriched: (currentMetrics.leadsEnriched || 0) + (output.leadsEnriched || 0),
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function executeMarketingAgentTask(
  agentId: string,
  taskId: string,
  input: any
): Promise<any> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { persona: true },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  const task = await db.agentTask.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  await db.agentTask.update({
    where: { id: taskId },
    data: { status: 'running', startedAt: new Date() },
  });

  try {
    let output: any = {};
    const config = (agent.config as any) || {};

    switch (task.type) {
      case TASK_TYPES.BUYING_SIGNAL_ANALYSIS: {
        if (!agent.persona) {
          throw new Error('Agent must be assigned to a persona');
        }

        // Analyze recent events to identify strong buying signals
        const recentEvents = await db.event.findMany({
          where: {
            ts: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          orderBy: { ts: 'desc' },
          take: 500,
        });

        // Group events by session and analyze patterns
        const sessionPatterns = recentEvents.reduce((acc, event) => {
          if (!acc[event.sessionId]) {
            acc[event.sessionId] = [];
          }
          acc[event.sessionId].push(event);
          return acc;
        }, {} as Record<string, typeof recentEvents>);

        const model = openrouter('anthropic/claude-3.5-sonnet');
        const { object } = await generateObject({
          model,
          schema: z.object({
            buyingSignals: z.array(z.object({
              signal: z.string(),
              strength: z.enum(['weak', 'medium', 'strong', 'very_strong']),
              description: z.string(),
              triggerConditions: z.array(z.string()),
            })),
            recommendedActions: z.array(z.string()),
          }),
          prompt: `Analyze user behavior patterns and identify strong buying signals for this persona:

Persona: ${agent.persona.name}
Description: ${agent.persona.description}

Recent user events show patterns like:
${Object.entries(sessionPatterns).slice(0, 10).map(([sessionId, events]) => `
Session ${sessionId.slice(0, 8)}:
${events.map(e => `- ${e.type}: ${JSON.stringify(e.payload)}`).join('\n')}
`).join('\n---\n')}

Identify:
1. Strong buying signals that indicate high purchase intent
2. Behavioral patterns that predict conversion
3. Trigger conditions for each signal
4. Recommended marketing actions when signals are detected

Focus on actionable, specific signals that can be programmatically detected.`,
        });

        // Update persona with buying signal insights
        await db.persona.update({
          where: { id: agent.persona.id },
          data: {
            signals: object.buyingSignals,
            webInsights: {
              ...(agent.persona.webInsights as any || {}),
              buyingSignalAnalysis: {
                analyzedAt: new Date(),
                signals: object.buyingSignals,
                recommendedActions: object.recommendedActions,
              },
            },
          },
        });

        output = {
          personaId: agent.persona.id,
          signalsIdentified: object.buyingSignals.length,
          strongSignals: object.buyingSignals.filter(s => 
            s.strength === 'strong' || s.strength === 'very_strong'
          ).length,
          recommendedActions: object.recommendedActions,
        };
        break;
      }

      case TASK_TYPES.CAMPAIGN_CREATION: {
        if (!agent.persona) {
          throw new Error('Agent must be assigned to a persona');
        }

        // Get top offers for this persona
        const topOffers = await db.offer.findMany({
          where: {
            cps: { gte: config.minOfferScore || 70 },
          },
          orderBy: { cps: 'desc' },
          take: 3,
        });

        if (topOffers.length === 0) {
          throw new Error('No suitable offers found for campaign');
        }

        // Generate campaign strategy using AI
        const model = openrouter('anthropic/claude-3.5-sonnet');
        const { object } = await generateObject({
          model,
          schema: z.object({
            campaignName: z.string(),
            channels: z.array(z.enum(['email', 'twitter', 'facebook', 'linkedin', 'chat', 'seo'])),
            goals: z.object({
              targetClicks: z.number(),
              targetConversions: z.number(),
              targetRevenue: z.number(),
            }),
            emailSubjectLines: z.array(z.string()),
            emailBody: z.string(),
            socialMediaCopy: z.string(),
            seoKeywords: z.array(z.string()),
          }),
          prompt: `Create a comprehensive marketing campaign for this persona and offers:

Persona: ${agent.persona.name}
Description: ${agent.persona.description}
Buying Signals: ${JSON.stringify(agent.persona.signals)}
Channels: ${agent.persona.channels.join(', ')}

Top Offers to Promote:
${topOffers.map(o => `
- ${o.name} (${o.merchant})
  Payout: ${o.payout}
  CPS: ${o.cps}
  Description: ${o.description}
`).join('\n')}

Create a campaign that:
1. Has a compelling name
2. Uses the best channels for this persona
3. Sets realistic goals (clicks, conversions, revenue)
4. Includes 3-5 email subject line variations for A/B testing
5. Provides detailed email body copy (HTML format, personalized)
6. Creates engaging social media copy
7. Suggests SEO keywords for content marketing

Make it highly targeted and conversion-focused.`,
        });

        // Create campaign in database
        const campaign = await db.campaign.create({
          data: {
            name: object.campaignName,
            personaId: agent.persona.id,
            channels: object.channels,
            offerIds: topOffers.map(o => o.id),
            goals: object.goals,
            status: 'draft',
          },
        });

        // Create email creative variations
        const creatives = await Promise.all(
          object.emailSubjectLines.map((subject, index) =>
            db.creative.create({
              data: {
                campaignId: campaign.id,
                channel: 'email',
                subject,
                body: object.emailBody,
                ctaUrl: topOffers[0].url,
                variant: String.fromCharCode(97 + index), // a, b, c, etc.
              },
            })
          )
        );

        output = {
          campaignId: campaign.id,
          campaignName: object.campaignName,
          channels: object.channels,
          creativesCreated: creatives.length,
          offers: topOffers.map(o => ({ id: o.id, name: o.name })),
          seoKeywords: object.seoKeywords,
          socialMediaCopy: object.socialMediaCopy,
        };
        break;
      }

      case TASK_TYPES.CAMPAIGN_LAUNCH: {
        // Find draft campaigns ready to launch
        const draftCampaigns = await db.campaign.findMany({
          where: {
            status: 'draft',
            personaId: agent.personaId || undefined,
          },
          include: {
            persona: true,
            creatives: true,
          },
          take: config.maxCampaignsToLaunch || 1,
        });

        const launchedCampaigns = [];

        for (const campaign of draftCampaigns) {
          // Get leads for this persona that haven't been contacted
          const leads = await db.customerLead.findMany({
            where: {
              personaId: campaign.personaId,
              outreachStatus: 'discovered',
              email: { not: null },
            },
            take: config.maxLeadsPerCampaign || 50,
          });

          if (leads.length === 0) {
            continue;
          }

          // Get the first email creative
          const creative = campaign.creatives.find(c => c.channel === 'email');
          if (!creative) {
            continue;
          }

          // Send emails to leads
          const emailsSent = [];
          for (const lead of leads) {
            if (!lead.email) continue;

            try {
              const emailResult = await emailService.sendEmail({
                to: lead.email,
                subject: creative.subject || 'Personalized Recommendation',
                body: creative.body,
                leadId: lead.id,
              });

              if (emailResult.success) {
                emailsSent.push(lead.id);
                await db.customerLead.update({
                  where: { id: lead.id },
                  data: {
                    outreachStatus: 'contacted',
                    outreachAttempts: { increment: 1 },
                    lastContactedAt: new Date(),
                  },
                });
              }
            } catch (error) {
              console.error(`Error sending email to ${lead.email}:`, error);
            }
          }

          // Update campaign status
          await db.campaign.update({
            where: { id: campaign.id },
            data: { status: 'active' },
          });

          launchedCampaigns.push({
            campaignId: campaign.id,
            campaignName: campaign.name,
            emailsSent: emailsSent.length,
          });
        }

        output = {
          campaignsLaunched: launchedCampaigns.length,
          totalEmailsSent: launchedCampaigns.reduce((sum, c) => sum + c.emailsSent, 0),
          campaigns: launchedCampaigns,
        };
        break;
      }

      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'completed',
        output,
        completedAt: new Date(),
      },
    });

    const currentMetrics = (agent.metrics as any) || {};
    await db.agent.update({
      where: { id: agentId },
      data: {
        metrics: {
          ...currentMetrics,
          tasksCompleted: (currentMetrics.tasksCompleted || 0) + 1,
          campaignsCreated: (currentMetrics.campaignsCreated || 0) + (output.campaignId ? 1 : 0),
          campaignsLaunched: (currentMetrics.campaignsLaunched || 0) + (output.campaignsLaunched || 0),
          emailsSent: (currentMetrics.emailsSent || 0) + (output.totalEmailsSent || 0),
        },
        lastRunAt: new Date(),
      },
    });

    return output;
  } catch (error: any) {
    await db.agentTask.update({
      where: { id: taskId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

export async function runAgentLoop(agentId: string): Promise<void> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
    include: { persona: true },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  if (agent.status !== 'working') {
    console.log(`Agent ${agent.name} is not in working status, skipping`);
    return;
  }

  console.log(`Running agent loop for ${agent.name} (${agent.type})`);

  // Get pending tasks for this agent
  const pendingTasks = await db.agentTask.findMany({
    where: {
      agentId: agent.id,
      status: 'pending',
    },
    orderBy: {
      createdAt: 'asc',
    },
    take: 1,
  });

  if (pendingTasks.length === 0) {
    // No pending tasks, create a new one based on agent type
    console.log(`No pending tasks for ${agent.name}, creating new task...`);
    await createNextTask(agent.id, agent.type, agent.personaId);
    return;
  }

  // Execute the next pending task
  const task = pendingTasks[0];
  const taskInput = task.input as any;

  // Update agent's currentTask field
  const taskDescription = `${task.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`;
  await db.agent.update({
    where: { id: agent.id },
    data: { currentTask: taskDescription },
  });

  try {
    console.log(`Executing task ${task.id} (${task.type}) for agent ${agent.name}`);
    
    switch (agent.type) {
      case AGENT_TYPES.RESEARCHER:
        await executeResearcherTask(agent.id, task.id, taskInput);
        break;
      case AGENT_TYPES.OUTREACH:
        await executeOutreachTask(agent.id, task.id, taskInput);
        break;
      case AGENT_TYPES.OPTIMIZER:
        await executeOptimizerTask(agent.id, task.id, taskInput);
        break;
      case AGENT_TYPES.DEAL_FINDER:
        await executeDealFinderTask(agent.id, task.id, taskInput);
        break;
      case AGENT_TYPES.PERSONA_WRITER:
        await executePersonaWriterTask(agent.id, task.id, taskInput);
        break;
      case AGENT_TYPES.LIST_BUILDER:
        await executeListBuilderTask(agent.id, task.id, taskInput);
        break;
      case AGENT_TYPES.MARKETING_AGENT:
        await executeMarketingAgentTask(agent.id, task.id, taskInput);
        break;
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }

    console.log(`Task ${task.id} completed successfully for agent ${agent.name}`);
    
    // Clear currentTask after completion
    await db.agent.update({
      where: { id: agent.id },
      data: { currentTask: null },
    });
  } catch (error) {
    console.error(`Error executing task ${task.id} for agent ${agent.name}:`, error);
    
    // Clear currentTask on error
    await db.agent.update({
      where: { id: agent.id },
      data: { currentTask: null },
    });
  }
}

async function createNextTask(
  agentId: string,
  agentType: string,
  personaId: string | null
): Promise<void> {
  let taskType: string;
  let taskInput: any = {};

  console.log(`Creating next task for agent ${agentId} (type: ${agentType})`);

  switch (agentType) {
    case AGENT_TYPES.RESEARCHER: {
      // Check if we need to discover new leads
      const recentLeads = await db.customerLead.count({
        where: {
          personaId: personaId || undefined,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      });

      console.log(`Researcher has ${recentLeads} recent leads`);

      if (recentLeads < 10) {
        // Changed from 5 to 10 to be more aggressive about lead discovery
        taskType = TASK_TYPES.LEAD_DISCOVERY;
        taskInput = {
          maxLeads: 10,
        };
        console.log(`Creating LEAD_DISCOVERY task (recent leads: ${recentLeads})`);
      } else {
        taskType = TASK_TYPES.WEB_SEARCH;
        taskInput = {};
        console.log(`Creating WEB_SEARCH task (enough recent leads)`);
      }
      break;
    }

    case AGENT_TYPES.OUTREACH: {
      // Find leads that need outreach
      const leadsNeedingOutreach = await db.customerLead.findMany({
        where: {
          personaId: personaId || undefined,
          outreachStatus: 'discovered',
          email: { not: null }, // Must have email
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
      });

      console.log(`Found ${leadsNeedingOutreach.length} leads needing outreach`);

      if (leadsNeedingOutreach.length > 0) {
        taskType = TASK_TYPES.OUTREACH_GENERATION;
        taskInput = {
          leadId: leadsNeedingOutreach[0].id,
        };
        console.log(`Creating OUTREACH_GENERATION task for lead ${leadsNeedingOutreach[0].id}`);
      } else {
        // No leads available, log and skip task creation
        console.log('No leads needing outreach, skipping task creation');
        return;
      }
      break;
    }

    case AGENT_TYPES.OPTIMIZER: {
      // Alternate between offer optimization and SEO optimization
      const lastTask = await db.agentTask.findFirst({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      if (!lastTask || lastTask.type === TASK_TYPES.SEO_OPTIMIZATION) {
        taskType = TASK_TYPES.OFFER_OPTIMIZATION;
        console.log(`Creating OFFER_OPTIMIZATION task`);
      } else {
        taskType = TASK_TYPES.SEO_OPTIMIZATION;
        console.log(`Creating SEO_OPTIMIZATION task`);
      }
      taskInput = {};
      break;
    }

    case AGENT_TYPES.DEAL_FINDER: {
      // Check when we last synced offers
      const lastSyncTask = await db.agentTask.findFirst({
        where: { 
          agentId,
          type: TASK_TYPES.OFFER_SYNC,
          status: 'completed',
        },
        orderBy: { createdAt: 'desc' },
      });

      const hoursSinceLastSync = lastSyncTask 
        ? (new Date().getTime() - new Date(lastSyncTask.createdAt).getTime()) / (1000 * 60 * 60)
        : 999; // If never synced, set high value

      console.log(`Hours since last offer sync: ${hoursSinceLastSync.toFixed(1)}`);

      // Sync offers every 6 hours, score them in between
      if (hoursSinceLastSync > 6) {
        taskType = TASK_TYPES.OFFER_SYNC;
        console.log(`Creating OFFER_SYNC task (last sync: ${hoursSinceLastSync.toFixed(1)}h ago)`);
      } else {
        taskType = TASK_TYPES.OFFER_SCORING;
        console.log(`Creating OFFER_SCORING task`);
      }
      taskInput = {};
      break;
    }

    case AGENT_TYPES.PERSONA_WRITER: {
      // Check how many personas we have
      const personaCount = await db.persona.count();
      console.log(`Current persona count: ${personaCount}`);
      
      if (personaCount < 20) {
        taskType = TASK_TYPES.PERSONA_GENERATION;
        console.log(`Creating PERSONA_GENERATION task (current: ${personaCount}/20)`);
      } else {
        // Cycle through monitoring and switching
        const lastTask = await db.agentTask.findFirst({
          where: { agentId },
          orderBy: { createdAt: 'desc' },
        });

        if (!lastTask || lastTask.type === TASK_TYPES.OFFER_SWITCHING) {
          taskType = TASK_TYPES.CAMPAIGN_MONITORING;
          console.log(`Creating CAMPAIGN_MONITORING task`);
        } else if (lastTask.type === TASK_TYPES.CAMPAIGN_MONITORING) {
          taskType = TASK_TYPES.OFFER_SWITCHING;
          console.log(`Creating OFFER_SWITCHING task`);
        } else {
          taskType = TASK_TYPES.PERSONA_GENERATION;
          console.log(`Creating PERSONA_GENERATION task (default)`);
        }
      }
      taskInput = {};
      break;
    }

    case AGENT_TYPES.LIST_BUILDER: {
      if (!personaId) {
        console.log('List-Builder agent requires a persona assignment, skipping task creation');
        return;
      }

      // Check if we have unenriched leads
      const unenrichedLeads = await db.customerLead.count({
        where: {
          personaId,
          OR: [
            { email: null },
            { company: null },
          ],
        },
      });

      console.log(`Found ${unenrichedLeads} unenriched leads`);

      const lastTask = await db.agentTask.findFirst({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
      });

      // Alternate between building and enriching, but prefer building if no recent tasks
      if (unenrichedLeads > 5 && lastTask?.type === TASK_TYPES.LEAD_LIST_BUILDING) {
        taskType = TASK_TYPES.LEAD_ENRICHMENT;
        console.log(`Creating LEAD_ENRICHMENT task (${unenrichedLeads} leads need enrichment)`);
      } else {
        taskType = TASK_TYPES.LEAD_LIST_BUILDING;
        console.log(`Creating LEAD_LIST_BUILDING task`);
      }
      taskInput = {};
      break;
    }

    case AGENT_TYPES.MARKETING_AGENT: {
      if (!personaId) {
        console.log('Marketing-Agent requires a persona assignment, skipping task creation');
        return;
      }

      // Check for draft campaigns
      const draftCampaigns = await db.campaign.count({
        where: {
          personaId,
          status: 'draft',
        },
      });

      console.log(`Found ${draftCampaigns} draft campaigns`);

      if (draftCampaigns > 0) {
        taskType = TASK_TYPES.CAMPAIGN_LAUNCH;
        console.log(`Creating CAMPAIGN_LAUNCH task`);
      } else {
        const lastTask = await db.agentTask.findFirst({
          where: { agentId },
          orderBy: { createdAt: 'desc' },
        });

        if (!lastTask || lastTask.type === TASK_TYPES.CAMPAIGN_LAUNCH) {
          taskType = TASK_TYPES.BUYING_SIGNAL_ANALYSIS;
          console.log(`Creating BUYING_SIGNAL_ANALYSIS task`);
        } else if (lastTask.type === TASK_TYPES.BUYING_SIGNAL_ANALYSIS) {
          taskType = TASK_TYPES.CAMPAIGN_CREATION;
          console.log(`Creating CAMPAIGN_CREATION task`);
        } else {
          taskType = TASK_TYPES.CAMPAIGN_LAUNCH;
          console.log(`Creating CAMPAIGN_LAUNCH task (default)`);
        }
      }
      taskInput = {};
      break;
    }

    default:
      console.error(`Unknown agent type: ${agentType}`);
      throw new Error(`Unknown agent type: ${agentType}`);
  }

  // Create the task
  const createdTask = await db.agentTask.create({
    data: {
      agentId,
      type: taskType,
      status: 'pending',
      input: taskInput,
    },
  });

  console.log(`Created task ${createdTask.id} (${taskType}) for agent ${agentId}`);
}

export async function startAgent(agentId: string): Promise<void> {
  const agent = await db.agent.findUnique({
    where: { id: agentId },
  });

  if (!agent) {
    throw new Error('Agent not found');
  }

  await db.agent.update({
    where: { id: agentId },
    data: { status: 'working' },
  });

  console.log(`Started agent ${agentId} (${agent.name})`);

  // Create an initial task if the agent has no pending tasks
  const pendingTasks = await db.agentTask.count({
    where: {
      agentId,
      status: 'pending',
    },
  });

  if (pendingTasks === 0) {
    console.log(`Creating initial task for newly started agent ${agent.name}`);
    await createNextTask(agentId, agent.type, agent.personaId);
  }
}

export async function stopAgent(agentId: string): Promise<void> {
  await db.agent.update({
    where: { id: agentId },
    data: { status: 'paused' },
  });

  console.log(`Stopped agent ${agentId}`);
}

export async function runAllAgents(): Promise<void> {
  const activeAgents = await db.agent.findMany({
    where: { status: 'working' },
  });

  console.log(`[${new Date().toISOString()}] Running agent scheduler: ${activeAgents.length} active agents`);

  if (activeAgents.length === 0) {
    console.log('No active agents to run');
    return;
  }

  for (const agent of activeAgents) {
    try {
      await runAgentLoop(agent.id);
    } catch (error) {
      console.error(`Error in agent loop for ${agent.name} (${agent.id}):`, error);
      
      // Mark agent as error status
      await db.agent.update({
        where: { id: agent.id },
        data: { 
          status: 'error',
          currentTask: null,
        },
      });
    }
  }

  console.log(`[${new Date().toISOString()}] Agent scheduler run complete`);
}
