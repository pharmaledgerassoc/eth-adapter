function addAnchor(anchorFactory, account,
                   anchorID, controlString,
                   newHashLinkSSI, ZKPValue, lastHashLinkSSI,
                   signature, publicKey,
                   callback) {
    //Concurrent transactions
    //https://github.com/ChainSafe/web3.js/issues/1301
    //fixed in 2.0, but is alpha
    anchorFactory.getTransactionCount(account, (err, count) =>{
        if (err){
            console.log('Failed to get the next nonce', err);
            return callback(err);
        }
        const nextNonce = count;

        console.log('Input for addAnchor smart contract : ',anchorID,controlString,
            newHashLinkSSI, ZKPValue, lastHashLinkSSI,
            signature, publicKey);
        anchorFactory.methods.addAnchor(anchorID, controlString,
            newHashLinkSSI, ZKPValue, lastHashLinkSSI,
            signature, publicKey).send({from: account, gas: 1500000, nonce: nextNonce}).then((f) => {
            const statusCode = f.events.InvokeStatus.returnValues.statusCode.toString().trim();
            console.log("Smart contract status code : ", statusCode);
            if (statusCode === "200" || statusCode === "201") {
                callback(null, "Success");
            } else {
                console.log("execute callback error : status code : <", statusCode, ">, EVAL :", statusCode === "200");
                callback(new Error("Status Code " + statusCode), null);
            }
        })
            .catch(err => {
                console.log({
                    anchorID,
                    controlString, newHashLinkSSI, ZKPValue, lastHashLinkSSI, signature, publicKey, account
                });
                console.log(err);
                callback(err, null);
            });
    })

}


module.exports = addAnchor;
