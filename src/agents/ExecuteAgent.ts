import { AbiFunction, Address, PublicClient } from 'viem';
import logger from '../services/logger';
import { ExecutionPlan } from '../types/Plan';
import { ExpressionParser } from '../utils/expressionParser';
import RecoveryAgent from '../agents/RecoveryAgent';
import { RecoveryAttempt } from '../types/Recovery';

type Operation = '+' | '-' | '*' | '/';

export default class ExecuteAgent {
  private client: PublicClient;
  private contractAddress: Address;
  private abi: AbiFunction[];
  private stepOutputs: Map<number, any>;
  private recoveryAgent: RecoveryAgent;

  constructor(client: PublicClient, contractAddress: Address, abi: AbiFunction[]) {
    this.client = client;
    this.contractAddress = contractAddress;
    this.abi = abi;
    this.stepOutputs = new Map();
    this.recoveryAgent = new RecoveryAgent();
  }

  async executePlan(plan: ExecutionPlan, retryCount = 0): Promise<void> {
    const MAX_RETRIES = 3;
    
    try {
      logger.info('Executing plan...');
      
      for (const [index, step] of plan.steps.entries()) {
        let processedArgs: any[] = [];
        try {
          logger.info(`Step ${index + 1}: ${step.functionName}\n  - ${step.description}\n  - ${step.expectedOutput.type}: ${step.expectedOutput.description}`);
          
          processedArgs = step.inputs.map(input => {
            const inputValue = input.value;
            
            // First, handle any retrieved values
            const retrievedValue = ExpressionParser.retrieveValue(
              inputValue,
              (index: number) => {
                if (!this.stepOutputs.has(index)) {
                  throw new Error(`Referenced output from ${index} not found`);
                }
                return this.stepOutputs.get(index);
              }
            );

            // If it's a number, check if we need to perform any mathematical operations
            if (typeof retrievedValue === 'number') {
              // You can add your mathematical expression logic here
              // For example, checking if there's a "- 1" or "+ 2" operation to perform
              const expressionMatch = input.value.match(/[+\-*/]\s*(\d+)$/);
              if (expressionMatch) {
                const [_, operandStr] = expressionMatch;
                const operator = input.value.match(/([+\-*/])/)[1] as Operation;
                return ExpressionParser.evaluateExpression(
                  retrievedValue,
                  operator,
                  parseFloat(operandStr)
                );
              }
            }

            return retrievedValue;
          });

          if (step.inputs.length > 0) {
            logger.info('Inputs:\n' + step.inputs.map((input, i) => 
              `  - ${input.name} (${input.type}): ${processedArgs[i]}`
            ).join('\n'));
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
          
          logger.info(`Output: ${output}`);
        } catch (error: unknown) {
          logger.error(`Error executing step ${index + 1} (${step.functionName}):`, error);
          
          if (retryCount >= MAX_RETRIES) {
            throw new Error(`Max retries (${MAX_RETRIES}) exceeded. Giving up.`);
          }

          const recovery: RecoveryAttempt = {
            failedStep: index,
            error: error as Error,
            originalPlan: plan,
            context: {
              previousStepOutputs: this.stepOutputs,
              failedFunction: step.functionName,
              failedArgs: processedArgs
            }
          };

          const newPlan = await this.recoveryAgent.handleFailure(recovery);
          logger.info('Generated recovery plan, retrying execution...');
          
          return this.executePlan(newPlan, retryCount + 1);
        }
      }
    } catch (error) {
      logger.error(`Error executing plan:`, error);
      throw error;
    }
  }
} 