module.exports = function Factory(rpcAddress, contractAddress, abi, privateKey) {
    this.web3 = buildFactory(rpcAddress, privateKey);
    this.contract = new this.web3.eth.Contract(abi, contractAddress);

    function buildFactory(rpcAddress, privateKey) {
        const Web3 = require('web3');
        const web3 = new Web3(new Web3.providers.HttpProvider(rpcAddress));
        const web3acc = web3.eth.accounts.privateKeyToAccount(privateKey);
        web3.eth.accounts.wallet.add(web3acc);
        web3.eth.defaultAccount = web3acc.address;
        return web3;
    }


};
