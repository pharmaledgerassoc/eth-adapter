function parseSSI(ssi) {
    const keySSISpace = require("opendsu").loadApi("keyssi");
    return keySSISpace.parse(ssi);
}

function errorWrapper(msg, err) {
    const errorSpace = require("opendsu").loadApi("error");
    return errorSpace.createOpenDSUErrorWrapper(msg, err);
}

function decodeBase58(encodedValue) {
    const openDsuCrypto = require("opendsu").loadApi("crypto");
    return openDsuCrypto.decodeBase58(encodedValue);
}


function convertDerSignatureToASN1(derSignatureBuffer) {
    const openDsuCrypto = require("opendsu").loadApi("crypto");
    return openDsuCrypto.convertDerSignatureToASN1(derSignatureBuffer);
}

module.exports = {
    decodeBase58,
    convertDerSignatureToASN1,
    parseSSI,
    errorWrapper
}