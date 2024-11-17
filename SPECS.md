# Web3 Agent

Web3 Agent is a tool that allows you to interact with Web3 APIs by using simple and intuitive language.

The agent is powered by a large language model that can understand and generate code to execute actions.

The agent can be used to plan, simulate, critique, and execute complex workflows.

The core blockchain interactions are executed from a proxy contract that is owned by the user. This proxy contract will hold balances and tokens on behalf of the user.

## Scope

- Agents:
    - Research
        - Searches accepted knowledge respositories on the internet for information
        - Downloads contract addresses and ABIs
        - Uses firecrawl to search whitelisted websites for information
    - Plan
        - Plans a flow to achieve a goal
    - Simulate
        - Simulates a plan that achieves the original goal
    - Critique
        - Critiques a simulation based on the original goal
    - Execute
        - Executes a flow
        - Requires a user confirmation
    - Monitor
        - Monitors a flow
        - Uses event listeners and polling to monitor the progress of a flow
- Local APIs for interacting with the agent(s)
    - REST API
        - Provides endpoints for interacting with the agents
        - Built with Express.js in Node.js
- Database for storing data
    - JSON abis
    - Contract addresses
    - Documentation
- Security
    - Local handling of private keys; never exposed to external services
    - Private key is stored in an environment variable
    - Local handling of transaction signing; never exposed to external services
- EVM networks via remote RPC endpoints
    - Starting with Avalanche Mainnet
- Proxy contract
    - Owned by the user
    - Holds balances and tokens on behalf of the user
    - Only the user can interact with this contract

## Out of Scope

- Graphical user interface
- User authentication for APIs
- Rate limited for APIs
- Webhook support
- Backup and recovery mechanisms
- Non-EVM chains
- Managing multiple connections per chain
- Managing RPC outtages or rate limits
- Limiting complexity of transactions or workflows
- Automated signing; the user must always be in control

## Tech Stack

- Forge
- OpenAI
- Typescript
- Viem
- Shell
- pm2
- Solidity
- OpenZeppelin smart contracts

## File structure

```
.
├── src
│   ├── evm
│   │   ├── abis
│   │   ├── contract_addresses
│   ├── agent
│   │   ├── plan.ts
│   │   ├── simulate.ts
│   │   ├── critique.ts
│   │   ├── execute.ts
│   ├── services
│   │   ├── etherscan.ts
│   ├── logger.ts
│   ├── api
│   │   ├── server.ts
│   ├── db
│   │   ├── json_abis.json
│   │   ├── contract_addresses.json
│   │   ├── documentation.md
├── package.json
├── tsconfig.json
```

## Example flows

- Plan a flow to get balances of an account
- Plan a flow to get leverage on an account
- Plan a flow to swap assets on an account
