module.exports = function Config(callback) {

    //config map
    if (typeof process.env.SMARTCONTRACTADDRESS !== "undefined") {
        console.log('Using env SMARTCONTRACTADDRESS : ', process.env.SMARTCONTRACTADDRESS);
        this.contractAddress = process.env.SMARTCONTRACTADDRESS;
    } else {
        return callback(
            new Error("SMARTCONTRACTADDRESS not found."))
    }

    //config map
    if (typeof process.env.SMARTCONTRACTABI !== "undefined") {
        console.log('Using env SMARTCONTRACTABI : ', process.env.SMARTCONTRACTABI);
        this.abi = JSON.parse(process.env.SMARTCONTRACTABI);
    } else {
        return callback(new Error("SMARTCONTRACTABI not found."))
    }

    //config map
    if (typeof process.env.RPC_ADDRESS !== "undefined") {
        console.log('Using env RPC_ADDRESS : ', process.env.RPC_ADDRESS);
        this.rpcAddress = process.env.RPC_ADDRESS;
    } else {
        return callback(new Error("RPC_ADDRESS not found."))
    }

    //secrets - ORGACCOUNT
    if (typeof process.env.ORGACCOUNT !== "undefined") {
        console.log('Using env ORGACCOUNT : ', process.env.ORGACCOUNT)
        let orgacc;
        try {
            orgacc = JSON.parse(process.env.ORGACCOUNT);
        } catch (e) {
            return callback(e);
        }
        console.log("orgacc", orgacc, typeof orgacc, Object.keys(orgacc));
        console.log("Address", orgacc.address, orgacc["address"]);
        console.log("PrivateKey", orgacc.privateKey, orgacc["privateKey"]);
        this.account = orgacc.address;
        this.accountPrivateKey = orgacc.privateKey;
        console.log("config state after setting account credentials", this.account, this.accountPrivateKey);
        console.log(this);
    } else {
        return callback(new Error("ORGACCOUNT not found."))
    }

    console.log('Finish loading data from env.');
    console.log(this);
    callback(undefined, this);

};
