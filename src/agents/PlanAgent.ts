import { AbiFunction } from 'viem';
import logger from '../services/logger';
import OpenAI from 'openai';
import { ExecutionPlan } from '../types/Plan';

export default class PlanAgent {
  private openai: OpenAI;
  private lastCritique: string | null = null;

  constructor(
    private readOnlyFunctions: AbiFunction[],
    private sourceCode?: string
  ) {
    logger.info('Initializing Plan Agent...');

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    if (!process.env.OPENAI_BASE_URL) {
      throw new Error('OPENAI_BASE_URL environment variable is required');
    }

    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL
    });
  }

  public incorporateFeedback(feedback: string): void {
    this.lastCritique = feedback;
  }

  async createPlan(goal: string): Promise<ExecutionPlan> {
    logger.info('Planning contract data exploration using AI...');
    logger.debug(`Goal: ${goal}`);

    const functionDescriptions = this.readOnlyFunctions.map(func => ({
      name: func.name,
      inputs: func.inputs || [],
      outputs: func.outputs || [],
      stateMutability: func.stateMutability
    }));

    const systemPrompt = `
You are a blockchain expert who creates structured plans for acheiving a user's goal by calling smart contract functions.
    
You will create a structured plan that:
1. Has a clear goal
2. Lists specific function calls to make
3. Explains why each call is useful
4. Suggests input values where needed
`;
    let userPrompt = `# Goal:\n\n${goal}`;
    userPrompt += `\n\n## Available functions:\n\n\`\`\`json\n${JSON.stringify(functionDescriptions, null, 2)}\n\`\`\``;

    if (this.sourceCode) {
      userPrompt += `\n\n## Contract Source Code:\n\n\`\`\`solidity\n${this.sourceCode}\n\`\`\``;
    }

    // Include the previous critique in the prompt if it exists
    userPrompt += this.lastCritique 
      ? `\n\n## Previous plan critique:\n\n${this.lastCritique}`
      : '';

    // Define the function for structured output
    const planFunction = {
      name: "create_execution_plan",
      description: "Create a structured plan for exploring a smart contract",
      parameters: {
        type: "object",
        properties: {
          steps: {
            type: "array",
            items: {
              type: "object",
              properties: {
                functionName: { type: "string" },
                description: { type: "string" },
                inputs: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      value: { type: "string", optional: true }
                    },
                    required: ["name", "type"]
                  }
                },
                expectedOutput: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    description: { type: "string" }
                  },
                  required: ["type", "description"]
                }
              },
              required: ["functionName", "description", "inputs", "expectedOutput"]
            }
          },
          goal: { type: "string" }
        },
        required: ["steps", "goal"]
      }
    };

    try {
      const completion = await this.openai.chat.completions.create({
        // model: "gpt-4-turbo-preview",
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: systemPrompt
        }, {
          role: "user",
          content: userPrompt
        }],
        tools: [{
          type: "function",
          function: planFunction
        }],
        tool_choice: {
          type: "function",
          function: { name: "create_execution_plan" }
        }
      });

      const toolCall = completion.choices[0].message.tool_calls?.[0];
      if (!toolCall) {
        throw new Error('No tool call found in response');
      }

      const plan = JSON.parse(toolCall.function.arguments) as ExecutionPlan;
      logger.debug(`AI Generated plan: ${plan.goal}`);
      return plan;

    } catch (error) {
      logger.error('Failed to generate AI plan:', error);
      throw new Error('Failed to generate AI plan');
    }
  }
} 