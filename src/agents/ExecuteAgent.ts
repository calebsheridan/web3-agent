import { AbiFunction, Address, PublicClient } from 'viem';
import logger from '../services/logger';
import { ExecutionPlan } from '../types/Plan';

export default class ExecuteAgent {
  private client: PublicClient;
  private contractAddress: Address;
  private abi: AbiFunction[];
  private stepOutputs: Map<number, any>;

  constructor(client: PublicClient, contractAddress: Address, abi: AbiFunction[]) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.stepOutputs = new Map();
  }

  async executePlan(plan: ExecutionPlan): Promise<void> {
    logger.info('Executing plan...');
    
    for (const [index, step] of plan.steps.entries()) {
      try {
        logger.info(`Step ${index + 1}: ${step.functionName}`);
        logger.info(`Description: ${step.description}`);
        
        const processedArgs = step.inputs.map(input => {
          const inputValue = input.value;
          if (typeof inputValue === 'string' && inputValue.startsWith('<retrieved ')) {
            const referencedFunction = inputValue.replace('<retrieved ', '').replace('>', '');
            
            const previousStep = plan.steps.findIndex(s => s.functionName === referencedFunction);
            if (previousStep === -1 || !this.stepOutputs.has(previousStep)) {
              throw new Error(`Referenced output from ${referencedFunction} not found`);
            }
            
            return this.stepOutputs.get(previousStep);
          }
          return input.value;
        });

        if (step.inputs.length > 0) {
          logger.info('Inputs:');
          step.inputs.forEach((input, i) => {
            logger.info(`  - ${input.name} (${input.type}): ${processedArgs[i]}`);
          });
        }
        
        logger.info('Expected Output:', step.expectedOutput);
        
        logger.debug('Executing contract call with:', {
          address: this.contractAddress,
          functionName: step.functionName,
          args: processedArgs
        });

        const abiFunction = this.abi.find((item: AbiFunction) => 
          item.type === 'function' && 
          item.name === step.functionName
        );

        if (!abiFunction) {
          throw new Error(`ABI function not found for ${step.functionName}`);
        }

        const output = await this.client.readContract({
          address: this.contractAddress,
          abi: [abiFunction],
          functionName: step.functionName,
          args: processedArgs
        });
        
        this.stepOutputs.set(index, output);
        
        logger.info(`Actual Output: ${output}`);
      } catch (error) {
        logger.error(`Error executing step ${index + 1} (${step.functionName}):`, error);
        throw error;
      }
    }
  }
} 