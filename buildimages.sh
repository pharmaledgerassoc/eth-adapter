#!/usr/bin/env bash


cd ./SmartContracts

docker build --no-cache -t anchor_smart -f dockerfile . --network=host
docker tag anchor_smart:latest pharmaledger/anchor_smart:latest
docker push pharmaledger/anchor_smart:latest

cd ..
cd ./EthAdapter

docker build --no-cache -t apiadapter -f dockerfile-dev . --network=host
docker tag apiadapter:latest pharmaledger/apiadapter:latest
docker push pharmaledger/apiadapter:latest

