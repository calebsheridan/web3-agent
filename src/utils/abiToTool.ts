import { AbiFunction } from 'viem';

export function abiFunctionToTool(abiFunction: AbiFunction) {
    // Convert the ABI function to a tool compatible with OpenAI Tool Use API
    const tool = {
        name: abiFunction.name,
        description: abiFunction.name,
        inputs: abiFunction.inputs?.map((input: any) => ({
            name: input.name || '',
            type: input.type
        })),
        outputs: abiFunction.outputs?.map((output: any) => ({
            name: output.name || '',
            type: output.type
        }))
    };

    return tool;
} 