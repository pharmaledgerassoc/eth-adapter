# ETH Adapter
This repository provides smart contract and adapter implementations to be used in pair with [OpenDSU](https://opendsu.com/) technology. 

## Table of contents
1. [Versions and compabitilities](#versions-and-compabitilities)    
2. [Repository structure](#repository-structure)
3. [Smart contract](#smart-contract)
4. [Adapter](#adapter)

## Versions and compabitilities
ETH Adapter needs to be in sync the [OpenDSU](https://opendsu.com/) implementation used in different PharmaLedger Workspaces (use cases) in order to ensure a strong Blockchain anchoring foundation. 

For example, the **latest ETH Adapter** versions needs to be paired with **[>= v1.1.0 ePI-workspace](https://github.com/pharmaledgerassoc/epi-workspace/releases)**. For older [ePI-workspace](https://github.com/pharmaledgerassoc/epi-workspace) releases use the [older version](https://github.com/OpenDSU/eth-adapter/tree/a36774c624dbe360f4d2bc8e5ca653db4ecd21a9).

## Repository structure
The repository strucure is based mostly on two main folders: one folder containing the [smart contract](https://github.com/OpenDSU/eth-adapter/blob/master/SmartContracts) that needs to be deploy into the blockchain network and in the other one the [Adapter](https://github.com/OpenDSU/eth-adapter/tree/master/EthAdapter) that is in sync with the smart contract APIs. The smart contract and adapter source code are tied together into the same repository due to the fact that there is is a strong coupling between them.

## Smart Contract
The ETH Adapter needs a custom smart contract in order to be able to ensure the anchor creation, anchor version management and other processes that are used in and by the [OpenDSU](https://opendsu.com/) technology.  To understand the OpenDSU concepts used in the smart contract and the role of the smart contract please refer to the [OpenDSU website](https://opendsu.com/).
The exact smart contract source code is available by accessing the following [link](https://github.com/OpenDSU/eth-adapter/blob/master/SmartContracts/contracts/Anchoring.sol).
In the [Smart contract folder](https://github.com/OpenDSU/eth-adapter/blob/master/SmartContracts)  besides the smart contract source code there are also docker file and Kubernetes templates examples that can be used in order to ensure a quick deployment into the Blockchain network. 
The smart contract deployment is handled via [truffle migrate](https://trufflesuite.com/docs/truffle/getting-started/running-migrations.html)

### Smart contract deployment
#### Deployment procedure with Docker and Kubernetes
The deployment procedure starts with the build process for the Docker image. In order to do this it is the execution the following commands is needed. Pay attention that in the following commands you need to replace the **pharmaledger** ID with one of yours before executing them.
```
cd ./SmartContracts
docker build --no-cache -t anchor_smart -f dockerfile . --network=host
docker tag anchor_smart:latest pharmaledger/anchor_smart:latest
docker push pharmaledger/anchor_smart:latest
```
For demo purposes we used [hub.docker.com](https://hub.docker.com/) repository but any docker image repository can be used if needed. The image build process can be skipped if you are happy with the images published into **phrmaledger** account. Keep in mind that some image tags can be intermediary builds and may or not contain unstable code.

Now that you have your docker images published and ready we need to review and customize the Kubernetes resource example files. These files are available into the [Smart contracts/K8 folder](https://github.com/OpenDSU/eth-adapter/tree/master/SmartContracts/K8)

Let's start with **anchor-configmap.yaml** file where you need to provide the ETH node account address that will be used in order to deploy the smart contract, the IP address and port of the ETH node. Please, make sure that the ETH node that you will use to deploy the smart contract is accessible from the location where you will deploy the docker image that we previous built and published.

```
apiVersion: v1
kind: ConfigMap
metadata:
name: new-anchor-configmap
data:
PORT: "5000"
ACCOUNT: "0x66d66805E29EaB5XXXXXXXXXXXXXX"
RPC_HOST: "10.100.19.243"
```
Once you make all the needed changes into the anchor-configmap.yaml file save it and deploy with the kubectl apply command into your Kubernetes cluster. 

Next review and update if needed the **anchor_smart.yaml** file in which the Kubernetes Pod is described and our docker image previous built and published is used. If you previously made the choice to use your own Docker repository please make the same replacement to the **pharmaledger** ID with the one that you used during the Docker image build and publish steps.
```
apiVersion: v1

kind: Pod

metadata:
  name: new-anchorsmart
  labels:
    app: new-anchorsmart

spec:
  restartPolicy: "Always"
  containers:
    - name: new-anchorsmart-container
      image: pharmaledger/anchor_smart:latest
      imagePullPolicy: Always
      env:
      # API endpoint to obtain abi and smart contract address by reading the value of 'contractAddress' or 'abi' from the returned json
      # GET /contractAddress
      # GET /abi
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: new-anchor-configmap
              key: PORT
        - name: ACCOUNT
          valueFrom:
            configMapKeyRef:
              name: new-anchor-configmap
              key: ACCOUNT
        - name: RPC_HOST
          valueFrom:
            configMapKeyRef:
              name: new-anchor-configmap
              key: RPC_HOST

---
apiVersion: v1
kind: Service
metadata:
  name: new-anchorsmart-service
  labels:
    name: new-anchorsmart-service

spec:
  selector:
    app: new-anchorsmart

  ports:
    - port: 5000
      targetPort: 5000

  type: ClusterIP
```
Once the customization is done for the **anchor_smart.yaml** save it and deploy it into your Kubernetes cluster.

Now check the logs for the newly Kubernetes Pod called new-anchorsmart and check the truffle migration status, progress and out. If everything goes well you will be able to see into the log the newly deployed smart contract address that you will need when doing the Adapter deployment process.

## Adapter
The Adapter represents a standalone HTTP server that is able to make calls to the [smart contract](https://github.com/OpenDSU/eth-adapter/blob/master/SmartContracts/contracts/Anchoring.sol) in the name of a pre-configured ETH account by knowing the smart contract address and [ABI](https://docs.soliditylang.org/en/v0.5.3/abi-spec.html). Each smart contract call is signed with a private key of an ETH account. The smart contract address, ABI and ETH account identification details needs to be provided by configuration. The smart contract address and ABI are obtained after the deployment of the contract into the Blockchain network.

### Adapter deployment
In order to prepare the Adapter deployment you first of all need to make sure that you have a smart contract deployed into the Blockchain network and know its address and ABI. Also you will need to have a ETH Account that you control, meaning that you have its address and private key.

#### Deployment procedure with Docker and Kubernetes
Similar to the Smart contract deployment procedure, first of all we need to prepare the Docker image and publish it. Pay attention that in the following commands you need to replace the **pharmaledger** ID with one of yours before executing them.
```
cd ./EthAdapter
docker build --no-cache -t apiadapter -f dockerfile-dev . --network=host
docker tag apiadapter:latest pharmaledger/apiadapter:latest
docker push pharmaledger/apiadapter:latest
```
Now that you have your docker images published and ready we need to review and customize the Kubernetes resource example files. These files are available into the [EthAdapter/k8s](https://github.com/OpenDSU/eth-adapter/tree/master/EthAdapter/k8s)
Review and customize by needs the **ethadapter-configmap.yaml** file.
```
apiVersion: v1
kind: ConfigMap
metadata:
  name: new-eth-adapter-config
data:
  SMARTCONTRACTADDRESS: "0x8256c703AB0d9E5bf5bbAcec2eafc20d95F82365"
  SMARTCONTRACTABI: '[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{...}]'
  RPC_ADDRESS: "http://10.100.19.243:8545"
  ORGACCOUNT: '{"address": "0x0eDC5F0610b41633FFC965fB4cFbXXXXXX", "privateKey": "0x71f0e86d105d64ab7c45f8b0c9c726xxxyyyaaa5dace1cfddd44415deef"}'
```
The SMARTCONTRACTADDRESS needs to be updated with the smart contract address that you deployed or choose to use with your ETH Adapter. The SMARTCONTRACTABI needs to be updated with the ABI of the smart contract. The RPC_ADDRESS needs to point to the ETH Node that the ETH Adapter will use in order to create new transaction to the smart contract. Pay attention to include the HTTP protocol into the RPC_ADDRESS value in order for the Adapter to know how to properly make the calls to the ETH node. The value of ORGACCOUNT needs to be updated with the ETH account that you control and chose to authorize the ETH adapter to use for the smart contract calls.

After the customization make sure to save the file and deploy into your Kubernetes cluster.

Review and update, if needed the **EthAdapter.yaml** file. If you previously made the choose to use your own Docker repository please make the same replacement to the **pharmaledger** ID with the one that you used during the Docker image build and publish steps.
```
apiVersion: v1

kind: Pod

metadata:
  name: new-ethadapter
  labels:
    app: new-ethadapter

spec:
  containers:
    - name: new-ethadapter-container
      image: pharmaledger/apiadapter:latest
      env:
        - name: RPC_ADDRESS
          valueFrom:
            configMapKeyRef:
              name: new-eth-adapter-config
              key: RPC_ADDRESS
        - name: SMARTCONTRACTADDRESS
          valueFrom:
            configMapKeyRef:
              name: new-eth-adapter-config
              key: SMARTCONTRACTADDRESS
        - name: SMARTCONTRACTABI
          valueFrom:
            configMapKeyRef:
              key: SMARTCONTRACTABI
              name: new-eth-adapter-config
        - name: ORGACCOUNT
          valueFrom:
            configMapKeyRef:
              key: ORGACCOUNT
              name: new-eth-adapter-config
      ports:
        - containerPort: 3000
      imagePullPolicy: Always


---


apiVersion: v1
kind: Service
metadata:
  name: new-ethadapter-service
  labels:
    name: new-ethadapter-service

spec:
  selector:
    app: new-ethadapter

  ports:
    - port: 3000
      targetPort: 3000

  type: LoadBalancer
```
Make sure that you understand that this Adapter is exposed to the INTERNET by that fact that we used a LoadBalancer type of service in the above yaml example file. If you will deploy the APIHUB into the same Kubernetes cluster you may want to change the LoadBalancer into a ClusterIP.
After the customization make sure to save the file and deploy it into your Kubernetes cluster.
