const ethUtils = require("../utils/eth");
const {parseSSI, errorWrapper} = require("../utils/opendsuutils");

function ensureResultIsEncoded(result){
    if(Array.isArray(result)){
        result = result.map(item=>{
            return parseSSI(item).getIdentifier();
        });
        return result;
    }

    if(result){
        return parseSSI(result).getIdentifier();
    }
}

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

async function getV(anchorId, newAnchorValue) {

    let versions = await $$.promisify(getAllVersions)(anchorId);

    if (typeof anchorId === "string") {
        anchorId = parseSSI(anchorId);
    }
    if (typeof newAnchorValue === "string") {
        newAnchorValue = parseSSI(newAnchorValue);
    }
    if (!anchorId.canAppend()) {
        return 0;
    }

    let publicKey = getPublicKey(anchorId, versions).toString("hex");
    let signature = "0x" + newAnchorValue.getSignature("raw").toString("hex");
    let lastVersion = versions[versions.length - 1];
    let dataToSign = newAnchorValue.getDataToSign(anchorId, lastVersion);

    return ethUtils.getV(signature, publicKey, dataToSign);
}

async function createOrAppendToAnchor(anchorID, newAnchorValue, operation = "createAnchor", callback) {
    console.log('Input for create or append smart contract : ', anchorID, newAnchorValue);

    const txManager = await require("./../services/transactionManager").getInstance();
    let err;
    try {
        anchorID = parseSSI(anchorID).getIdentifier(true);
        newAnchorValue = parseSSI(newAnchorValue).getIdentifier(true);
        await txManager.sendWriteTransaction(operation, anchorID, newAnchorValue);
    } catch (error) {
        err = error;
    }
    callback(err);
}

function createAnchor(anchorID, newAnchorValue, callback) {
    createOrAppendToAnchor(anchorID, newAnchorValue, "createAnchor", callback);
}

function appendAnchor(anchorID, newAnchorValue, callback) {
    createOrAppendToAnchor(anchorID, newAnchorValue, "appendAnchor", callback);
}

async function createMultipleAnchorsInput(anchors) {
    const res = [];
    for (let i = 0; i < anchors.length; i++) {
        let anchorId = parseSSI(anchors[i].anchorId);
        const newAnchorValue = parseSSI(anchors[i].anchorValue);
        res.push(anchorId.getIdentifier(true));
        res.push(newAnchorValue.getIdentifier(true));
    }

    return res;
}

async function createOrUpdateMultipleAnchors(anchors, callback) {
    let error, input;
    try {
        input = await createMultipleAnchorsInput(anchors);
    } catch (err) {
        error = errorWrapper("Failed to generate input for createOrAppendMultipleAnchors", err);
    }

    try {
        const txManager = await require("./../services/transactionManager").getInstance();
        await txManager.sendWriteTransaction("createOrUpdateMultipleAnchors", input);
    } catch (err) {
        error = errorWrapper("Failed createOrAppendMultipleAnchors", err);
    }

    callback(error);
}

async function dumpAnchors(from, limit, maxSize, callback) {
    const {errorWrapper} = require("../utils/opendsuutils");

    let result, error;
    try {
        const txManager = await require("./../services/transactionManager").getInstance();
        result = await txManager.sendReadTransaction("dumpAnchors", from, limit, maxSize);
    } catch (err) {
        error = errorWrapper("Failed dumpAnchors", err);
    }

    callback(error, result);
}

async function getAllVersions(anchorID, callback) {
    if (typeof anchorID === "string") {
        anchorID = parseSSI(anchorID);
    }

    anchorID = anchorID.getIdentifier(true);
    let result, error;
    try {
        const txManager = await require("./../services/transactionManager").getInstance();
        result = await txManager.sendReadTransaction("getAllVersions", anchorID);
    } catch (err) {
        error = errorWrapper("Failed getAllVersions", err);
    }

    callback(error, ensureResultIsEncoded(result));
}

async function getLastVersion(anchorID, callback) {
    if (typeof anchorID === "string") {
        anchorID = parseSSI(anchorID);
    }

    anchorID = anchorID.getIdentifier(true);
    let result, error;
    try {
        const txManager = await require("./../services/transactionManager").getInstance();
        result = await txManager.sendReadTransaction("getLastVersion", anchorID);
    } catch (err) {
        error = errorWrapper("Failed getAllVersions", err);
    }

    callback(error, ensureResultIsEncoded(result));
}

async function totalNumberOfAnchors(callback) {
    let result, error;
    try {
        const txManager = await require("./../services/transactionManager").getInstance();
        result = await txManager.sendReadTransaction("totalNumberOfAnchors");
    } catch (err) {
        error = errorWrapper("Failed getAllVersions", err);
    }

    callback(error, result);
}

module.exports = {
    createAnchor,
    appendAnchor,
    getV,
    createOrUpdateMultipleAnchors,
    totalNumberOfAnchors,
    getLastVersion,
    getAllVersions,
    dumpAnchors
}