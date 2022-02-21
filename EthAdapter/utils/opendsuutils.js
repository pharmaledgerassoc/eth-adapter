function parseSSI(ssi) {
    require("../../../privatesky/psknode/bundles/openDSU");
    openDSURequire('overwrite-require');

    const keySSISpace = openDSURequire("opendsu").loadApi("keyssi");
    return keySSISpace.parse(ssi);
}

function errorWrapper(msg, err) {
    require("../../../privatesky/psknode/bundles/openDSU");
    openDSURequire('overwrite-require');

    const errorSpace = openDSURequire("opendsu").loadApi("error");
    return errorSpace.createOpenDSUErrorWrapper(msg, err);
}

function decodeBase58(encodedValue) {
    require("../../../privatesky/psknode/bundles/openDSU");
    openDSURequire('overwrite-require');

    const openDsuCrypto = openDSURequire("opendsu").loadApi("crypto");
    return openDsuCrypto.decodeBase58(encodedValue);
}


function convertDerSignatureToASN1(derSignatureBuffer) {
    require("../../../privatesky/psknode/bundles/openDSU");
    openDSURequire('overwrite-require');

    const openDsuCrypto = openDSURequire("opendsu").loadApi("crypto");
    return openDsuCrypto.convertDerSignatureToASN1(derSignatureBuffer);
}

module.exports = {
    decodeBase58,
    convertDerSignatureToASN1,
    parseSSI,
    errorWrapper
}