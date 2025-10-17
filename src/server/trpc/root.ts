import { createCallerFactory, createTRPCRouter } from "~/server/trpc/main";
import * as auth from "~/server/trpc/procedures/auth";
import * as offers from "~/server/trpc/procedures/offers";
import * as personas from "~/server/trpc/procedures/personas";
import * as campaigns from "~/server/trpc/procedures/campaigns";
import * as events from "~/server/trpc/procedures/events";
import * as chat from "~/server/trpc/procedures/chat";
import * as agents from "~/server/trpc/procedures/agents";
import * as leads from "~/server/trpc/procedures/leads";
import * as clay from "~/server/trpc/procedures/clay";
import * as emails from "~/server/trpc/procedures/emails";
import * as webhooks from "~/server/trpc/procedures/webhooks";

export const appRouter = createTRPCRouter({
  // Auth
  auth: createTRPCRouter({
    register: auth.register,
    login: auth.login,
    getCurrentUser: auth.getCurrentUser,
    updateProfile: auth.updateProfile,
    changePassword: auth.changePassword,
  }),

  // Offers
  offers: createTRPCRouter({
    list: offers.listOffers,
    get: offers.getOffer,
    rank: offers.rankOffers,
    sync: offers.syncOffers,
    stats: offers.getOfferStats,
  }),

  // Personas
  personas: createTRPCRouter({
    list: personas.listPersonas,
    get: personas.getPersona,
    create: personas.createPersona,
    update: personas.updatePersona,
    suggest: personas.suggestPersonas,
  }),

  // Campaigns
  campaigns: createTRPCRouter({
    list: campaigns.listCampaigns,
    get: campaigns.getCampaign,
    create: campaigns.createCampaign,
    update: campaigns.updateCampaign,
    analytics: campaigns.getCampaignAnalytics,
    dashboardStats: campaigns.getDashboardStats,
  }),

  // Events
  events: createTRPCRouter({
    ingest: events.ingestEvent,
    getSession: events.getSessionEvents,
    computeBuyScore: events.computeBuyScore,
  }),

  // Chat
  chat: createTRPCRouter({
    history: chat.getChatHistory,
    send: chat.sendMessage,
    recommend: chat.recommendProducts,
  }),

  // Agents
  agents: createTRPCRouter({
    list: agents.listAgents,
    get: agents.getAgent,
    create: agents.createAgent,
    update: agents.updateAgent,
    start: agents.startAgent,
    stop: agents.stopAgent,
    tasks: agents.getAgentTasks,
    metrics: agents.getAgentMetrics,
    runLoop: agents.runAgentLoop,
    stats: agents.getAgentStats,
  }),

  // Leads
  leads: createTRPCRouter({
    list: leads.listLeads,
    get: leads.getLead,
    update: leads.updateLead,
    stats: leads.getLeadStats,
    recommendOffers: leads.recommendOffersForLead,
  }),

  // Clay (Data Enrichment)
  clay: createTRPCRouter({
    enrichLead: clay.enrichLead,
    findEmail: clay.findEmail,
    batchEnrich: clay.batchEnrich,
  }),

  // Emails
  emails: createTRPCRouter({
    listLeadEmails: emails.listLeadEmails,
    getStats: emails.getEmailStats,
    handleWebhook: emails.handleSendGridWebhook,
    globalStats: emails.getGlobalEmailStats,
  }),

  // Webhooks
  webhooks: createTRPCRouter({
    sendgrid: webhooks.handleSendGridWebhook,
  }),
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
