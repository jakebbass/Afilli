import * as orchestrator from "./agent-orchestrator";

let schedulerInterval: NodeJS.Timeout | null = null;
const AGENT_LOOP_INTERVAL = 60000; // 1 minute

export function startAgentScheduler() {
  if (schedulerInterval) {
    console.log('Agent scheduler already running');
    return;
  }

  console.log('Starting agent scheduler...');

  // Run immediately
  orchestrator.runAllAgents().catch(error => {
    console.error('Error in initial agent run:', error);
  });

  // Then run on interval
  schedulerInterval = setInterval(() => {
    orchestrator.runAllAgents().catch(error => {
      console.error('Error in agent scheduler:', error);
    });
  }, AGENT_LOOP_INTERVAL);

  console.log(`Agent scheduler started (interval: ${AGENT_LOOP_INTERVAL}ms)`);
}

export function stopAgentScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Agent scheduler stopped');
  }
}

export function isSchedulerRunning(): boolean {
  return schedulerInterval !== null;
}
