import { startAgentScheduler } from "~/server/services/agent-scheduler";

let hasRunSetup = false;

export async function setupApplication() {
  if (hasRunSetup) {
    return;
  }
  hasRunSetup = true;

  console.log("Running application setup...");
  
  // Start the agent scheduler (runs in background via setInterval)
  console.log("Starting agent scheduler...");
  startAgentScheduler();
  console.log("Agent scheduler started");
  
  console.log("Setup complete");
}
