let config = require("./../utils/config");
let {rpcAddress, contractAddress, abi, accountPrivateKey:privateKey} = config;
const defaultGasValue = 30000000;

async function TransactionManager() {
    const self = {};
    const Web3 = require('web3');
    const web3 = new Web3(new Web3.providers.HttpProvider(rpcAddress));

    const privateKeyBasedAccount = web3.eth.accounts.privateKeyToAccount(privateKey);

    web3.eth.accounts.wallet.add(privateKeyBasedAccount);
    web3.eth.defaultAccount = privateKeyBasedAccount.address;
    web3.eth.transactionPollingTimeout = 20;

    const contract = new web3.eth.Contract(abi, contractAddress);

    let readingNoncePromise;
    async function readLatestNonce() {
        if (!readingNoncePromise) {
            readingNoncePromise = new Promise((resolve, reject) => {
                web3.eth.getTransactionCount(web3.eth.defaultAccount)
                    .then(resolve)
                    .catch(reject);
            });
        }else{
            // another initialization can be in progress in the same time. we need to delay it a bit this one
            try{
                await readingNoncePromise;
            }catch(err){
                //err is not relevant for us
            }
            //we reset the flag just to be able to recall the same fnc
            readingNoncePromise = undefined;
            readingNoncePromise = readLatestNonce();
        }
        return readingNoncePromise;
    }

    let inProgressNonce = {};
    //the fact that we need to know the latest nonce we need to take in consideration that the following line can create
    //strange situations
    let lastNonce = await readLatestNonce();

    self.sendWriteTransaction = function (contractMethod, ...args) {
        return new Promise((resolve, reject) => {
            let nonce = lastNonce++;
            inProgressNonce[nonce] = {contract, args};

            contract.methods[contractMethod](...args)
                .send({from: web3.eth.defaultAccount, gas: defaultGasValue, nonce})
                .then((f) => {
                    const statusCode = f.events.InvokeStatus.returnValues.statusCode.toString().trim();
                    console.log(`Calling ${contractMethod} with args ${JSON.stringify(args)} finished with status code ${statusCode} `);

                    if (statusCode === "200" || statusCode === "201") {
                        inProgressNonce[nonce] = undefined;
                        delete inProgressNonce[nonce];
                        resolve(f.transactionHash);
                    } else {
                        const statusTranslations = require("./smartContractStatusConstants.json");
                        let error = Error(`Transaction ended with status code <${statusCode}> <${statusTranslations[statusCode]}>`);
                        error.code = statusCode;
                        reject(error);
                    }
                }).catch(err => {
                console.log(`Caught an error during ${contractMethod} with args ${JSON.stringify(args)}`);
                console.log(err);
                reject(err);
            });
        });
    }

    self.sendReadTransaction = function(contractMethod, ...args){
        return new Promise((resolve, reject) => {
            contract.methods[contractMethod](...args)
                .call()
                .then((result) => {
                    console.log(`Calling ${contractMethod} with args ${JSON.stringify(args)} finished`);
                    resolve(result);
                }).catch(err => {
                console.log(`Caught an error during ${contractMethod} with args ${JSON.stringify(args)}`);
                console.log(err);
                reject(err);
            });
        });
    }
    return self;
}

let instance;
module.exports.getInstance = async function () {
    if (!instance) {
        instance = await TransactionManager();
    }
    return instance;
}