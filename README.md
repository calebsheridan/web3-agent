
## Setup

Add `.env` file:

```bash
cp .env.example .env
```

Install dependencies and build:

```bash
yarn
yarn build
```

## Sample Usage

Input:

```bash
npx plan "What is the balance of stETH for this account: 0x98078db053902644191f93988341e31289e1c8fe"
```

Output:

```bash
info: Plan Goal: Read the stETH balance of the account 0x98078db053902644191f93988341e31289e1c8fe
Plan Steps:
  1. balanceOf - Retrieving the stETH balance of the specified account
warn: Plan validation failed on attempt 1. Retrying with feedback...
info: Attempt 1/3 to create valid plan
info: Valid plan found after 2 attempts.
info: Executing plan...
debug: Executing contract call with: {"address":"0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84","args":["0x98078db053902644191f93988341e31289e1c8fe"],"functionName":"balanceOf"}
info: Actual Output: 301210230623954684196129
```

Input:

```bash
npx plan "What is the latest Uniswap Factory pair?"
```

Output:

```bash
[info]: Executing plan...
[info]: Step 1: allPairsLength
  - Get the total number of pairs created in the Uniswap factory contract.
  - uint256: The total number of pairs created.
[info]: Expected Output:
[debug]: Executing contract call with:
[info]: Output: 389945
[info]: Step 2: allPairs
  - Get the address of the latest pair from the stored array of all pairs.
  - address: The address of the latest pair.
[debug]: Retrieved value matches: <retrieved 0 - 1> <retrieved 0 - 1>,0,-,1
[info]: Inputs:
  -  (uint256): 389944
[info]: Expected Output:
[debug]: Executing contract call with:
[info]: Output: 0x60DC410a2b8F00cf4e818bE901853702c95c4927
```
