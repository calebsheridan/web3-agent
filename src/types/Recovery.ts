import { ExecutionPlan } from "./Plan";

export interface RecoveryAttempt {
  failedStep: number;
  error: Error;
  originalPlan: ExecutionPlan;
  context: {
    previousStepOutputs: Map<number, any>;
    failedFunction: string;
    failedArgs: any[];
  };
} 