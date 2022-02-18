const ethUtils = require("../utils/eth");
const {parseSSI, errorWrapper} = require("../utils/opendsuutils");

function getLastTransferSSI(versions) {
    for (let i = versions.length - 1; i >= 0; i--) {
        let ssi = parseSSI(versions[i]);
        if (ssi.isTransfer()) {
            return ssi;
        }
    }

    return undefined;
}

function getPublicKey(anchorId, versions) {
    if (typeof anchorId === "string") {
        anchorId = parseSSI(anchorId);
    }
    if (versions.length === 0) {
        return anchorId.getPublicKey({outputFormat: "raw"});
    }
    const lastTransferSSI = getLastTransferSSI(versions);
    if (typeof lastTransferSSI === "undefined") {
        return anchorId.getPublicKey({outputFormat: "raw"});
    }
    return lastTransferSSI.getPublicKey();
}

async function getV(anchorFactory, anchorId, newAnchorValue) {
    let versions = await anchorFactory.contract.methods.getAllVersions(anchorId).call();
    if (typeof newAnchorValue === "string") {
        newAnchorValue = parseSSI(newAnchorValue);
    }
    let publicKey = "0x" + getPublicKey(anchorId, versions).toString("hex");
    let signature = "0x" + newAnchorValue.getSignature().toString("hex");
    let lastVersion = versions[versions.length - 1];
    let dataToSign = newAnchorValue.getDataToSign(anchorId, lastVersion);
    return ethUtils.getV(signature, publicKey, dataToSign);
}

function createOrAppendToAnchor(anchorFactory, account, anchorID, newAnchorValue, nextNonce, operation = "createAnchor", callback) {
    console.log('Input for addAnchor smart contract : ', anchorID, newAnchorValue);
    getV(anchorFactory, anchorID, newAnchorValue).then(v => {
        anchorID = parseSSI(anchorID).getIdentifier(true);
        newAnchorValue = parseSSI(newAnchorValue).getIdentifier(true);
        anchorFactory.contract.methods[operation](anchorID, newAnchorValue, v)
            .send({from: account, gas: 1500000, nonce: nextNonce}).then((f) => {
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
                console.log({anchorID, newAnchorValue, account});
                console.log(err);
                callback(err, null);
            });
    }).catch(err => {
        console.log({anchorID, newAnchorValue, account});
        console.log(err);
        return callback(errorWrapper("Failed to get v byte for signature", err));
    })
}

function createAnchor(anchorFactory, account, anchorID, newAnchorValue, nextNonce, callback) {
    createOrAppendToAnchor(anchorFactory, account, anchorID, newAnchorValue, nextNonce, "createAnchor", callback);
}

function appendAnchor(anchorFactory, account, anchorID, newAnchorValue, nextNonce, callback) {
    createOrAppendToAnchor(anchorFactory, account, anchorID, newAnchorValue, nextNonce, "appendAnchor", callback);
}

async function createMultipleAnchorsInput(anchorFactory, anchors) {
    const res = [];
    for (let i = 0; i < anchors.length; i++) {
        let anchorId = parseSSI(Object.keys(anchors[0])[0]);
        const newAnchorValue = parseSSI(Object.values(anchors[0])[0]);
        const v = await getV(anchorFactory, anchorId, newAnchorValue);
        res.push(anchorId.getIdentifier(true));
        res.push(newAnchorValue.getIdentifier(true));
        res.push(v.toString(10));
    }

    return res;
}

function createOrAppendMultipleAnchors(anchorFactory, account, anchors, nextNonce, callback) {
    createMultipleAnchorsInput(anchorFactory, anchors).then(input => {
        anchorFactory.contract.methods.createOrAppendMultipleAnchors(input)
            .send({from: account, gas: 1500000, nonce: nextNonce}).then((f) => {
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
                console.log({anchorID, newAnchorValue, account});
                console.log(err);
                callback(err, null);
            });
    }).catch(err => {
        return callback(errorWrapper("Failed to generate input for createOrAppendMultipleAnchors", err));
    })
}


module.exports = {
    createAnchor,
    appendAnchor,
    getV,
    createOrAppendMultipleAnchors
}