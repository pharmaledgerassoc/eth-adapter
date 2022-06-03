console.log("ETH Adapter reads necessary info from environment. Make sure to provide all the info according to official documentation");

let contractAddress;
if (typeof process.env.SMARTCONTRACTADDRESS !== "undefined") {
    contractAddress = process.env.SMARTCONTRACTADDRESS;
} else {
    throw new Error("Not able to read SMARTCONTRACTADDRESS from env.");
}

let abi;
if (typeof process.env.SMARTCONTRACTABI !== "undefined") {
    abi = JSON.parse(process.env.SMARTCONTRACTABI);
} else {
    throw new Error("Not able to read SMARTCONTRACTABI from env.");
}

let rpcAddress;
if (typeof process.env.RPC_ADDRESS !== "undefined") {
    rpcAddress = process.env.RPC_ADDRESS;
} else {
    throw new Error("Not able to read RPC_ADDRESS from env.");
}

let account;
let accountPrivateKey;
if (typeof process.env.ORGACCOUNT !== "undefined") {
    let orgacc = JSON.parse(process.env.ORGACCOUNT);
    account = orgacc.address;
    accountPrivateKey = orgacc.privateKey;
} else {
    throw new Error("Not able to read ORGACCOUNT from env.");
}

module.exports = {
    abi,
    account,
    accountPrivateKey,
    contractAddress,
    rpcAddress
}