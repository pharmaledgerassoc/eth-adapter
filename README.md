# ETH Adapter
This repository provides smart contract and adapter implementations to be used in pair with [OpenDSU](https://opendsu.com/) technology. 

## Table of contents
1. [Versions and compabitilities](#versions-and-compabitilities)    
2. [Repository structure](#repository-structure)
3. [Smart contract](#smart-contract)
4. [Adapter](#adapter)

## Versions and compabitilities
ETH Adapter needs to be in sync the [OpenDSU](https://opendsu.com/) implementation used in different PharmaLedger Workspaces (use cases) in order to ensure a strong Blockchain anchoring foundation. 

For example, the **latest ETH Adapter** versions needs to be paired with **[>= v1.1.0 ePI-workspace](https://github.com/PharmaLedger-IMI/epi-workspace/releases)**. For older [ePI-workspace](https://github.com/PharmaLedger-IMI/epi-workspace) releases use the [older version](https://github.com/PharmaLedger-IMI/eth-adapter/tree/62c61b45c9ff44900d31d79d1efc803e024c3589).

## Repository structure
The repository strucure is based mostly on two main folders: one folder containing the [smart contract](https://github.com/PharmaLedger-IMI/eth-adapter/blob/master/SmartContracts) that needs to be deploy into the blockchain network and in the other one the [Adapter](https://github.com/PharmaLedger-IMI/eth-adapter/tree/master/EthAdapter) that is in sync with the smart contract APIs. The smart contract and adapter source code are tight together into the same repository due to the fact that is a strong coupling between.

## Smart Contract
The ETH Adapter needs a custom smart contract in order to be able to ensure the anchor creation, anchor version management and other processes that are used in and by the [OpenDSU](https://opendsu.com/) technology.  To understand the OpenDSU concepts used into the smart contract and the role of the smart contract please refer to the [OpenDSU website](https://opendsu.com/).
The exact smart contract source code is available by accessing the following [link](https://github.com/PharmaLedger-IMI/eth-adapter/blob/master/SmartContracts/contracts/Anchoring.sol).
Into the [Smart contract folder](https://github.com/PharmaLedger-IMI/eth-adapter/blob/master/SmartContracts)  besides the smart contract source code there are also docker file and Kubernetes templates examples that can be used in order to ensure a quick deployment into the Blockchain network. 
The smart contract deployment is handled via [truffle migrate](https://trufflesuite.com/docs/truffle/getting-started/running-migrations.html)

## Adapter
The Adapter represents a standalone HTTP server that is able to make calls to the [smart contract](https://github.com/PharmaLedger-IMI/eth-adapter/blob/master/SmartContracts/contracts/Anchoring.sol) in the name of a pre-configured ETH account by knowing the smart contract address and [ABI](https://docs.soliditylang.org/en/v0.5.3/abi-spec.html). Each smart contract call is signed with a private key of an ETH account. The smart contract address, ABI and ETH account identification details needs to be provided by configuration. The smart contract address and ABI are obtained after the deployment of the contract into the Blockchain network.

