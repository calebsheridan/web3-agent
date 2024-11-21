
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