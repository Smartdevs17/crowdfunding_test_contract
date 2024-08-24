# CrowdFunding Smart Contract

This project implements a decentralized crowdfunding platform using Ethereum smart contracts. It allows users to create and manage fundraising campaigns, as well as make donations to existing campaigns.

## Features

- Create crowdfunding campaigns with customizable titles, descriptions, goals, and durations
- Make donations to active campaigns
- Automatic campaign closure when the goal is reached or the deadline passes
- Transfer of funds to the beneficiary upon successful campaign completion
- Contract owner can withdraw any leftover funds

## Smart Contract

The main smart contract `CrowdFunding.sol` is located in the `contracts/` directory. It includes the following key functions:

- `createCampaign`: Create a new crowdfunding campaign
- `donateToCampaign`: Make a donation to an existing campaign
- `endCampaign`: End a campaign (automatically called when goal is reached)
- `withdrawLeftoverFunds`: Allow the contract owner to withdraw any remaining funds

## Testing

The project includes a comprehensive test suite in `test/CrowdFunding.js`. To run the tests, use the following command:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/CrowdFunding.js
```
