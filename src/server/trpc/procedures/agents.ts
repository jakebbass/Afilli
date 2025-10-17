import { z } from "zod";
import { baseProcedure } from "~/server/trpc/main";
import { db } from "~/server/db";
import * as orchestrator from "~/server/services/agent-orchestrator";

export const listAgents = baseProcedure
  .input(
    z.object({
      status: z.enum(['idle', 'working', 'paused', 'error']).optional(),
      type: z.enum([
        'researcher', 
        'outreach', 
        'optimizer', 
        'orchestrator',
        'deal_finder',
        'persona_writer',
        'list_builder',
        'marketing_agent',
      ]).optional(),
    }).optional()
  )
  .query(async ({ input }) => {
    const where: any = {};

    if (input?.status) {
      where.status = input.status;
    }

    if (input?.type) {
      where.type = input.type;
    }

    const agents = await db.agent.findMany({
      where,
      include: {
        persona: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        _count: {
          select: {
            tasks: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return agents;
  });

export const getAgent = baseProcedure
  .input(z.object({ id: z.string() }))
  .query(async ({ input }) => {
    const agent = await db.agent.findUnique({
      where: { id: input.id },
      include: {
        persona: true,
        tasks: {
          take: 10,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    return agent;
  });

export const createAgent = baseProcedure
  .input(
    z.object({
      name: z.string().min(1),
      type: z.enum([
        'researcher', 
        'outreach', 
        'optimizer', 
        'orchestrator',
        'deal_finder',
        'persona_writer',
        'list_builder',
        'marketing_agent',
      ]),
      personaId: z.string().optional(),
      config: z.any().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const agent = await db.agent.create({
      data: {
        name: input.name,
        type: input.type,
        personaId: input.personaId,
        config: input.config || {},
        status: 'idle',
      },
      include: {
        persona: true,
      },
    });

    return agent;
  });

export const updateAgent = baseProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.string().min(1).optional(),
      personaId: z.string().optional(),
      config: z.any().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { id, ...data } = input;

    const agent = await db.agent.update({
      where: { id },
      data,
      include: {
        persona: true,
      },
    });

    return agent;
  });

export const startAgent = baseProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    await orchestrator.startAgent(input.id);

    const agent = await db.agent.findUnique({
      where: { id: input.id },
      include: {
        persona: true,
      },
    });

    return agent;
  });

export const stopAgent = baseProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ input }) => {
    await orchestrator.stopAgent(input.id);

    const agent = await db.agent.findUnique({
      where: { id: input.id },
      include: {
        persona: true,
      },
    });

    return agent;
  });

export const getAgentTasks = baseProcedure
  .input(
    z.object({
      agentId: z.string(),
      status: z.enum(['pending', 'running', 'completed', 'failed']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    })
  )
  .query(async ({ input }) => {
    const where: any = {
      agentId: input.agentId,
    };

    if (input.status) {
      where.status = input.status;
    }

    const [tasks, total] = await Promise.all([
      db.agentTask.findMany({
        where,
        take: input.limit,
        skip: input.offset,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      db.agentTask.count({ where }),
    ]);

    return {
      tasks,
      total,
      hasMore: input.offset + input.limit < total,
    };
  });

export const getAgentMetrics = baseProcedure
  .input(z.object({ agentId: z.string() }))
  .query(async ({ input }) => {
    const agent = await db.agent.findUnique({
      where: { id: input.agentId },
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    const [totalTasks, completedTasks, failedTasks, pendingTasks] = await Promise.all([
      db.agentTask.count({
        where: { agentId: input.agentId },
      }),
      db.agentTask.count({
        where: { agentId: input.agentId, status: 'completed' },
      }),
      db.agentTask.count({
        where: { agentId: input.agentId, status: 'failed' },
      }),
      db.agentTask.count({
        where: { agentId: input.agentId, status: 'pending' },
      }),
    ]);

    const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      completedTasks,
      failedTasks,
      pendingTasks,
      successRate,
      agentMetrics: agent.metrics,
      lastRunAt: agent.lastRunAt,
    };
  });

export const runAgentLoop = baseProcedure
  .input(z.object({ agentId: z.string() }))
  .mutation(async ({ input }) => {
    await orchestrator.runAgentLoop(input.agentId);

    return { success: true };
  });

export const getAgentStats = baseProcedure
  .query(async () => {
    const [total, byStatus, byType] = await Promise.all([
      db.agent.count(),
      db.agent.groupBy({
        by: ['status'],
        _count: true,
      }),
      db.agent.groupBy({
        by: ['type'],
        _count: true,
      }),
    ]);

    const totalTasks = await db.agentTask.count();
    const completedTasks = await db.agentTask.count({
      where: { status: 'completed' },
    });

    return {
      totalAgents: total,
      byStatus: byStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      byType: byType.map(item => ({
        type: item.type,
        count: item._count,
      })),
      totalTasks,
      completedTasks,
      successRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    };
  });
