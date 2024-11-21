import { ExecutionPlan } from '../types/Plan';
import { RecoveryAttempt } from '../types/Recovery';
import logger from '../services/logger';

export default class RecoveryAgent {
  async handleFailure(recovery: RecoveryAttempt): Promise<ExecutionPlan> {
    logger.info('Attempting to recover from failed execution...');
    logger.info(`Failed at step ${recovery.failedStep + 1}: ${recovery.context.failedFunction}`);

    // Analyze the error and context
    const errorAnalysis = this.analyzeError(recovery.error);
    
    // Generate a new plan based on the analysis
    const newPlan = await this.generateRecoveryPlan(recovery, errorAnalysis);
    
    return newPlan;
  }

  private analyzeError(error: Error): string {
    // Extract meaningful information from the error
    if (error.message.includes('invalid opcode')) {
      return 'CONTRACT_CALL_FAILED';
    }
    if (error.message.includes('Missing or invalid parameters')) {
      return 'INVALID_PARAMETERS';
    }
    return 'UNKNOWN_ERROR';
  }

  private async generateRecoveryPlan(
    recovery: RecoveryAttempt,
    errorType: string
  ): Promise<ExecutionPlan> {
    // Create a new plan based on the error type
    const { originalPlan, failedStep, context } = recovery;

    // Clone the original plan
    const newPlan: ExecutionPlan = {
      ...originalPlan,
      steps: [...originalPlan.steps]
    };

    switch (errorType) {
      case 'INVALID_PARAMETERS':
        // Modify the failed step with corrected parameters
        // This could involve querying alternative data sources
        // or using different parameter calculation methods
        break;
        
      case 'CONTRACT_CALL_FAILED':
        // Maybe try an alternative function or different contract
        break;
        
      default:
        throw new Error(`Unable to generate recovery plan for error type: ${errorType}`);
    }

    return newPlan;
  }
} 