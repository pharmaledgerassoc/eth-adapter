



module.exports = function Config(callback) {
    if (typeof process.env.RPC_ADDRESS !== "undefined")
    {
        console.log('Using env RPC_ADDRESS : ', process.env.RPC_ADDRESS);
        this.rpcAddress =  process.env.RPC_ADDRESS;
    }else {
        return callback(new Error("RPC_ADDRESS not found."))
    }

    if (typeof process.env.SMARTCONTRACTADDRESS !== "undefined")
    {
        console.log('Using env SMARTCONTRACTADDRESS : ', process.env.SMARTCONTRACTADDRESS);
        this.contractAddress =  process.env.SMARTCONTRACTADDRESS;
    }else {
        return callback(new Error("SMARTCONTRACTADDRESS not found."))
    }

    if (typeof process.env.SMARTCONTRACTABI !== "undefined")
    {
        console.log('Using env SMARTCONTRACTABI : ', process.env.SMARTCONTRACTABI);
        this.abi =  JSON.parse(process.env.SMARTCONTRACTABI);
    }else {
        return callback(new Error("SMARTCONTRACTABI not found."))
    }

    if (typeof process.env.ACCOUNT !== "undefined")
    {
        console.log('Using env ACCOUNT : ', process.env.ACCOUNT);
        this.account =  process.env.ACCOUNT;
    }else {
        return callback(new Error("ACCOUNT not found."))
    }

    if (typeof process.env.ACCOUNTPRIVATEKEY !== "undefined")
    {
        console.log('Using env ACCOUNTPRIVATEKEY : ', process.env.ACCOUNTPRIVATEKEY);
        this.accountPrivateKey =  process.env.ACCOUNTPRIVATEKEY;
    }else {
        return callback(new Error("ACCOUNTPRIVATEKEY not found."))
    }

    console.log('Finish loading data from env.');
    console.log(this);
    callback(undefined, this);

};
