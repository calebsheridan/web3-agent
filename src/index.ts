import getContractData from './services/etherscan';
import logger from './services/logger';
import { AbiFunction } from 'viem';
import { createPublicClient, http, Address } from 'viem';
import { mainnet } from 'viem/chains';
import PlanAgent from './agents/PlanAgent';
import ExecuteAgent from './agents/ExecuteAgent';
import CritiqueAgent from './agents/CritiqueAgent';
import { ExecutionPlan } from './types/Plan';

async function createAndCritiquePlan(
  planAgent: PlanAgent,
  critiqueAgent: CritiqueAgent,
  goal: string,
  context: {
    contractAddress: Address,
    chainId: string,
    sourceCode?: string,
    abi?: AbiFunction[]
  }
): Promise<{ plan: ExecutionPlan, critique: { isValid: boolean, feedback: string } }> {
  const plan = await planAgent.createPlan(goal);
  const planSteps = plan.steps.map((step, index) => 
    `  ${index + 1}. ${step.functionName} - ${step.description}`
  ).join('\n');
  
  logger.info(
    `Plan Goal: ${plan.goal}\n` +
    'Plan Steps:\n' +
    planSteps
  );

  const critique = await critiqueAgent.critiquePlan(goal, plan, context);
  logger.info(`Plan Critique: ${critique.feedback}`);

  return { plan, critique };
}

export async function startAgents(goal: string): Promise<void> {
  logger.info('Starting Web3 Agent...');
  // Initialize Viem client
  const client = createPublicClient({
    chain: mainnet,
    transport: http()
  });

  const chainId = '1';
  const contractAddress = '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84';
  
  // Get initial contract data
  let { abi, sourceCode } = await getContractData(chainId, contractAddress);
  
  // Check if this is a proxy contract by looking for 'implementation' function
  const implementationFunction = abi.find((item: AbiFunction) => 
    item.type === 'function' && 
    (item.name === 'implementation' || item.name === 'getImplementation')
  );

  if (implementationFunction) {
    logger.info('Proxy contract detected, fetching implementation...');
    logger.debug('Implementation Function:', implementationFunction);
    

    try {
      // Call implementation function
      // @ts-ignore
      const implementationAddress = await client.readContract({
        address: contractAddress as Address,
        abi: [implementationFunction] as const,
        functionName: implementationFunction.name,
        args: []
      }) as Address;
      logger.info(`Implementation address: ${implementationAddress}`);
      
      // Get the actual contract data from the implementation
      const implementationData = await getContractData(chainId, implementationAddress);
      abi = implementationData.abi;
      sourceCode = implementationData.sourceCode;
    } catch (error) {
      logger.error('Failed to fetch implementation:', error);
    }
  }

  const functionAbis = abi.filter((item: AbiFunction) => item.type === 'function');
  const readOnlyAbis = functionAbis.filter((item: AbiFunction) => 
    item.stateMutability === 'view' || item.stateMutability === 'pure'
  );

  const planAgent = new PlanAgent(readOnlyAbis, sourceCode);
  const critiqueAgent = new CritiqueAgent();
  
  const MAX_RETRIES = 3;
  let currentTry = 0;
  let validPlan: ExecutionPlan | null = null;
  
  while (currentTry < MAX_RETRIES) {
    currentTry++;
    logger.info(`Attempt ${currentTry}/${MAX_RETRIES} to create valid plan`);
    
    try {
      const { plan, critique } = await createAndCritiquePlan(
        planAgent,
        critiqueAgent,
        goal,
        {
          contractAddress: contractAddress as Address,
          chainId,
          sourceCode,
          abi
        }
      );
      logger.debug(`Critique feedback: ${critique.feedback}`);
      
      if (critique.isValid) {
        logger.info(`Plan validation succeeded on attempt ${currentTry}.`);
        validPlan = plan;
        break;
      }
      else {
        logger.warn(`Plan validation failed on attempt ${currentTry}. Retrying with feedback...`);
      }
      
      
      // Pass the critique feedback to the PlanAgent for the next attempt
      planAgent.incorporateFeedback(critique.feedback);
      
    } catch (error) {
      logger.error(`Error on attempt ${currentTry}:`, error);
    }
  }

  if (!validPlan) {
    logger.error(`Failed to create valid plan after ${MAX_RETRIES} attempts`);
    return;
  }

  logger.info(`Valid plan found after ${currentTry} attempts.`);
  logger.info(`Plan Goal: ${validPlan.goal}`);
  logger.info(`Plan Steps: ${validPlan.steps.map((step, index) => `  ${index + 1}. ${step.functionName} - ${step.description}`).join('\n')}`);

  // Create and use ExecuteAgent with the valid plan
  const executeAgent = new ExecuteAgent(client, contractAddress as Address, abi);
  await executeAgent.executePlan(validPlan);
}
