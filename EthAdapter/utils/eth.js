function getVSignature(signature, publicKey, valueToHash) {
    //hash
    const hashedValue = require('crypto').createHash('sha256').update(valueToHash).digest();
    //get account from hash & signature
    const eth = require('ethers');
    const signature1c = signature + '1c';
    const recoveredEthAddress1c = eth.utils.recoverAddress(hashedValue, signature1c).toLowerCase();
    //convert publicKey to account
    const ethw = require('@ethereumjs/wallet'); // Update @ethereumjs/wallet 2.x
    const ac = ethw.Wallet.fromPublicKey(Buffer.from(publicKey, 'hex'), true);
    const ethAccount = ac.getAddressString().toLowerCase();
    //compare them for v
    if (ethAccount === recoveredEthAddress1c) {
        return signature1c;
    }

    const signature1b = signature + '1b';
    const recoveredEthAddress1b = eth.utils.recoverAddress(hashedValue, signature1b).toLowerCase();
    //compare them for v
    if (ethAccount === recoveredEthAddress1b) {
        return signature1b;
    }
    console.log('signature 1c', signature1c);
    console.log('signature 1b', signature1b);
    console.log('received signature ', signature);
    console.log('Expected eth account ', ethAccount, ' but got ', recoveredEthAddress1c, ' and ', recoveredEthAddress1b);
    console.log('Unable to determine v !');
    throw ('Unable to determine v !');
}

function getV(signature, publicKey, data) {
    const rsvSignature = getVSignature(signature, publicKey, data);
    return Number("0x" + rsvSignature.slice(-2));
}

module.exports = {
    getVSignature,
    getV
};
