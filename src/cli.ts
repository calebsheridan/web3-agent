#!/usr/bin/env node

import { startAgents } from './index';
import logger from './services/logger';

function getGoalFromCommandLine(): string {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    logger.error('Please provide a goal. Usage: npx plan "your goal here"');
    process.exit(1);
  }
  return args[0];
}

async function main() {
  const goal = getGoalFromCommandLine();
  await startAgents(goal);
}

main().catch((error) => {
  logger.error('Failed to execute plan:', error);
  process.exit(1);
}); 