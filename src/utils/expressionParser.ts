import logger from "../services/logger";

type Operation = '+' | '-' | '*' | '/';

export class ExpressionParser {
  private static operations: Record<Operation, (a: number, b: number) => number> = {
    '+': (a, b) => a + b,
    '-': (a, b) => a - b,
    '*': (a, b) => a * b,
    '/': (a, b) => a / b,
  };

  /**
   * Retrieves a value from a previous step using the <retrieved X> or <retrieved X operation operand> syntax
   * @param expression The expression string to parse
   * @param getStepOutput Function to retrieve output from previous steps
   * @returns The retrieved value or the result of the mathematical operation
   */
  static retrieveValue(
    expression: string,
    getStepOutput: (index: number) => any
  ): any {
    if (typeof expression !== 'string') {
      return expression;
    }

    const matches = expression.match(/<retrieved (\d+)(?:\s*([\+\-\*\/])\s*(\d+(?:\.\d+)?))?>/);
    if (!matches) {
      return expression;
    }
    logger.debug(`Retrieved value matches: ${expression} ${matches}`);

    const [_, indexStr, operator, operandStr] = matches;
    const retrievedValue = getStepOutput(parseInt(indexStr));

    if (!operator || !operandStr) {
      return retrievedValue;
    }

    return this.evaluateExpression(
      Number(retrievedValue),
      operator as Operation,
      Number(operandStr)
    );
  }

  /**
   * Evaluates a mathematical expression
   * @param value The value to perform operation on
   * @param operator The mathematical operator
   * @param operand The number to operate with
   * @returns The result of the mathematical operation
   */
  static evaluateExpression(
    value: number,
    operator: Operation,
    operand: number
  ): number {
    const operation = this.operations[operator];
    if (!operation) {
      throw new Error(`Unsupported operation: ${operator}`);
    }
    return operation(value, operand);
  }
} 