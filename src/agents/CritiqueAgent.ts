import logger from '../services/logger';
import OpenAI from 'openai';
import { ExecutionPlan } from '../types/Plan';
import { Address, AbiFunction } from 'viem';

export default class CritiqueAgent {
  private openai: OpenAI;

  constructor() {
    logger.info('Initializing Critique Agent...');

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

  async critiquePlan(
    goal: string,
    plan: ExecutionPlan,
    context: {
      contractAddress: Address,
      chainId: string,
      sourceCode?: string,
      abi?: AbiFunction[]
    }
  ): Promise<{isValid: boolean, feedback: string}> {
    logger.info('Critiquing execution plan...');

    const systemPrompt = "You are a blockchain expert who reviews execution plans for making transactions through smart contracts.";
    const userPrompt = `Please critique this smart contract execution plan for contract ${context.contractAddress} on chain ${context.chainId}.

${context.sourceCode ? `Contract Source Code:
\`\`\`solidity
${context.sourceCode}
\`\`\`\n` : ''}

${context.abi ? `Contract ABI:
\`\`\`json
${JSON.stringify(context.abi, null, 2)}
\`\`\`\n` : ''}

Goal: ${goal}

Execution Plan:
${JSON.stringify(plan, null, 2)}

Analyze the plan for:
1. Correctness - Is the plan correct for the stated goal?
2. Effectiveness - Will the plan achieve the stated goal?
3. Efficiency - Is this the most efficient way to achieve the goal?
4. Completeness - Are any important steps or checks missing?
5. Safety - Are there any potential risks or security concerns?
6. Chain Compatibility - Are all operations compatible with the target chain?

Provide specific feedback on any issues found.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{
          role: "system",
          content: systemPrompt
        }, {
          role: "user",
          content: userPrompt
        }],
        temperature: 0.7,
      });

      const feedback = completion.choices[0].message.content || '';
      
      // Determine if the plan is valid based on the presence of critical issues in the feedback
      const criticalIssueIndicators = [
        'unsafe',
        'dangerous',
        'critical',
        'severe',
        'high risk',
        'wrong',
        'incorrect',
        'invalid',
        'missing required',
        'will not work'
      ];

      const isValid = !criticalIssueIndicators.some(indicator => 
        feedback.toLowerCase().includes(indicator)
      );

      return {
        isValid,
        feedback
      };
    } catch (error) {
      logger.error('Failed to critique plan:', error);
      throw new Error('Failed to critique plan');
    }
  }
}