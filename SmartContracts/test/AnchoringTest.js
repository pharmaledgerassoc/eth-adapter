const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

//opendsu
require("../../../privatesky/psknode/bundles/openDSU");
openDSURequire('overwrite-require');
const opendsuutils = require("../../EthAdapter/utils/opendsuutils");
const opendsu = openDSURequire("opendsu");
//end open dsu
const fs = require('fs');
const solc = require('solc');
const eth = require("../../EthAdapter/utils/eth");
// const Buffer = require("buffer");

let contractConnection;
let contract;
let contractResult;
let accounts;
let estimatedGas = 30000000;

function printErrors(compileRes, showWarnings = false) {
    if (!compileRes) {
        return;
    }
    compileRes.forEach(res => {
        if (res.type !== 'Warning' || showWarnings) {
            console.log(res);
        }
    });
}

beforeEach(async () => {

    try {
        const source = fs.readFileSync('./contracts/Anchoring.sol', 'utf8');
        var input = {
            language: 'Solidity',
            sources: {
                'Anchoring.sol': {
                    content: source
                }
            },
            settings: {
                outputSelection: {
                    '*': {
                        '*': ['*']
                    }
                }
            }
        };


        const compileRes = JSON.parse(solc.compile(JSON.stringify(input)));
        printErrors(compileRes.errors);
        const contrbase = compileRes.contracts['Anchoring.sol']['Anchoring'];
        const abiInterface = contrbase.abi;
        const bytecode = contrbase.evm.bytecode.object;
        accounts = await web3.eth.getAccounts();
        console.log("About to deploy contract");
        try {
            contractConnection = await new web3.eth.Contract(abiInterface);
            contract = contractConnection.deploy({data: bytecode});
            // estimatedGas = await contract.estimateGas();
            // estimatedGas =Math.floor(100000+estimatedGas);
            contractResult = await contract.send({from: accounts[0], gas: estimatedGas}, function (err, res) {
            })
        } catch (e) {
            console.log("Error at deploy", e);
        }
    } catch (err) {
        console.log(err);
    }

});

describe('AnchoringTest', () => {

    it('createAnchorAndGetVersion', async () => {

        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
        // const publicKeyRaw = seedSSI.getPublicKey("raw");
        const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
        const anchorID = anchorSSI.getIdentifier(true);
        const crypto = opendsu.loadAPI("crypto");
        const publicKey = anchorSSI.getControlString();
        const timestamp = Date.now() + '';
        const brickMapHash = "hash";
        const dataToSign = anchorID + brickMapHash;
        const signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
        const signatureHex = "0x" + signature.toString("hex");
        const newSignedHashLinkSSI = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
        const signedHLSSI = newSignedHashLinkSSI.getIdentifier(true);

        let v = eth.getV(signatureHex, Buffer.from(publicKey, "base64").toString("hex"), dataToSign);

        let result;
        try {
            let command = await contractResult.methods.createAnchor(anchorID, signedHLSSI, v);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                assert.equal(result.events.InvokeStatus.returnValues.statusCode, 200);
            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

            const anchors = await contractResult.methods.getAllVersions(anchorID).call();
            assert.equal(anchors.length, 1);
            assert.equal(anchors[0], signedHLSSI);
        } catch (e) {
            console.log("Error at encoding", e)
        }
    });
    it('appendAnchorAndGetVersions', async () => {

        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
        // const publicKeyRaw = seedSSI.getPublicKey("raw");
        const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
        const anchorID = anchorSSI.getIdentifier(true);
        const crypto = opendsu.loadAPI("crypto");
        const publicKey = anchorSSI.getControlString();
        const timestamp = Date.now() + '';
        let brickMapHash = "hash1";
        let dataToSign = anchorID + brickMapHash;
        let signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
        let signatureHex = "0x" + signature.toString("hex");
        let signedHashLinkSSI1 = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
        let signedHLSSI1 = signedHashLinkSSI1.getIdentifier(true);
        let v = eth.getV(signatureHex, Buffer.from(publicKey, "base64").toString("hex"), dataToSign);

        let result;
        try {
            let command = await contractResult.methods.createAnchor(anchorID, signedHLSSI1, v);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                brickMapHash = "hash2"
                dataToSign = anchorID + brickMapHash + signedHLSSI1;
                signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
                signatureHex = "0x" + signature.toString("hex");
                signedHashLinkSSI1 = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, Date.now(), {signature: signature.toString("base64")});
                signedHLSSI1 = signedHashLinkSSI1.getIdentifier(true);
                v = eth.getV(signatureHex, Buffer.from(publicKey, "base64").toString("hex"), dataToSign);

                assert.equal(result.events.InvokeStatus.returnValues.statusCode, 200);
                command = await contractResult.methods.appendAnchor(anchorID, signedHLSSI1, v);
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(result.events.InvokeStatus.returnValues.statusCode);
                assert.equal(result.events.InvokeStatus.returnValues.statusCode, 200);
            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }


            const anchors = await contractResult.methods.getAllVersions(anchorID).call();
            console.log(anchors)
            assert.equal(anchors.length, 2);
            assert.equal(anchors[1], signedHLSSI1);

            const totalNoAnchors = await contractResult.methods.totalNumberOfAnchors().call();
            console.log(totalNoAnchors);
            assert.equal(totalNoAnchors, 1);

            const listAnchors = await contractResult.methods.listAnchors(0, 1, 1000).call();
            console.log(listAnchors);
            assert.equal(listAnchors.length, 1);
            assert.equal(listAnchors[0].anchorId, anchorID);
            assert.equal(listAnchors[0].anchorValue, signedHLSSI1);
        } catch (e) {
            console.log("Error at encoding", e)
        }
    }).timeout(100000);

    it('createOrAppendMultipleAnchors', async () => {

        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        let NO_ANCHORS = 6;
        let anchors = '';
        let anchorsArray = []
        for (let i = 0; i < NO_ANCHORS; i++) {
            const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
            // const publicKeyRaw = seedSSI.getPublicKey("raw");
            const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
            const anchorID = anchorSSI.getIdentifier(true);
            const crypto = opendsu.loadAPI("crypto");
            const publicKey = anchorSSI.getControlString();
            const timestamp = Date.now() + '';
            let brickMapHash = "hash1";
            let dataToSign = anchorID + brickMapHash;
            let signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
            let signatureHex = "0x" + signature.toString("hex");
            let signedHashLinkSSI1 = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
            let signedHLSSI1 = signedHashLinkSSI1.getIdentifier(true);
            let v = eth.getV(signatureHex, Buffer.from(publicKey, "base64").toString("hex"), dataToSign);
            console.log(anchorID, signedHLSSI1);
            anchors += `${anchorID},${signedHLSSI1},${v.toString(10)}`
            anchorsArray.push(anchorID);
            anchorsArray.push(signedHLSSI1);
            anchorsArray.push(v.toString(10));
            if (i < NO_ANCHORS - 1) {
                anchors += " ";
            }
        }


        let result;
        try {
            let command = await contractResult.methods.createOrUpdateMultipleAnchors(anchorsArray);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });


                // console.log(result.events.StringResult.returnValues.str);
                assert.equal(result.events.InvokeStatus.returnValues.statusCode, 200);
                // assert.equal(result.events.InvokeStatus.returnValues.statusCode, 200);
            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }


            // const anchors = await contractResult.methods.getAllVersions(anchorID).call();
            // console.log(anchors)
            // assert.equal(anchors.length, 2);
            // assert.equal(anchors[1], signedHLSSI1);
        } catch (e) {
            console.log("Error at encoding", e)
        }
    }).timeout(100000);


    it('convertBytesToUInt', async () => {
        const timestamp = 123;
        console.log(timestamp)
        const stringTimestamp = timestamp.toString(10);
        const bytes = "0x" + Buffer.from(stringTimestamp).toString("hex");
        let result;
        try {


            const command = await contractResult.methods.convertBytesToUInt(bytes);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(result.events.UIntResult.returnValues.str);

            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

        } catch (e) {
            console.log("Error at encoding", e)
        }
    });

    it('testGetLastTransferSSI', async () => {
        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
        const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
        const anchorID = anchorSSI.getIdentifier(true);
        let result;
        try {

            const command = await contractResult.methods.testGetLastTransferSSI(anchorID);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(result.events.StringResult.returnValues.str);
                assert.equal("", result.events.StringResult.returnValues.str)

            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

        } catch (e) {
            console.log("Error at encoding", e)
        }
    });

    it('getTimestampFromAnchorValue', async () => {
        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
        const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
        const anchorID = anchorSSI.getIdentifier(true);
        const crypto = opendsu.loadAPI("crypto");
        const timestamp = Date.now();
        const brickMapHash = "hash";
        const dataToSign = anchorID + brickMapHash;
        const signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
        const newSignedHashLinkSSI = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
        const signedHLSSI = newSignedHashLinkSSI.getIdentifier(true);
        let result;
        try {

            const command = await contractResult.methods.testGetTimestampFromAnchorValue(signedHLSSI);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(result.events.UIntResult.returnValues.str);
                assert.equal(timestamp, result.events.UIntResult.returnValues.str)

            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

        } catch (e) {
            console.log("Error at encoding", e)
        }
    });

    it('isTransfer', async () => {
        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
        const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
        const anchorID = anchorSSI.getIdentifier(true);
        const crypto = opendsu.loadAPI("crypto");
        const timestamp = Date.now();
        const brickMapHash = "hash";
        const dataToSign = anchorID + brickMapHash;
        const signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
        const newTransferSSI = keySSISpace.createTransferSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
        const transferSSI = newTransferSSI.getIdentifier(true);
        const newSignedHashLinkSSI = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
        const newHLSSI = newSignedHashLinkSSI.getIdentifier(true);
        let result;
        try {

            let command = await contractResult.methods.testIsTransfer(transferSSI);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(result.events.BoolResult.returnValues.str);
                assert.equal(true, result.events.BoolResult.returnValues.str)

            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

            command = await contractResult.methods.testIsTransfer("ssi:shl:domain:specific:control:v0:hint");
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(result.events.BoolResult.returnValues.str);
                assert.equal(false, result.events.BoolResult.returnValues.str)

            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

        } catch (e) {
            console.log("Error at encoding", e)
        }
    });

    it('verify', async () => {

        const DOMAIN = 'default';
        const keySSISpace = opendsu.loadApi("keyssi");
        const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0', 'hint');
        // const publicKeyRaw = seedSSI.getPublicKey("raw");
        const anchorSSI = keySSISpace.parse(seedSSI.getAnchorId());
        const anchorID = anchorSSI.getIdentifier(true);
        const crypto = opendsu.loadAPI("crypto");
        const publicKey = anchorSSI.getControlString();
        const timestamp = Date.now() + '';
        const brickMapHash = "hash";
        //sign(hash(anchorId, hash Brick Map, lastEntryInAnchor, timestamp), privateKey Owner)
        // const dataToSign = require("crypto").createHash("sha256").update(anchorID+brickMapHash).digest();
        const dataToSign = anchorID + brickMapHash;
        // console.log("0x"+dataToSign.toString("hex"))
        const signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
        const signatureHex = "0x" + signature.toString("hex");
        const newSignedHashLinkSSI = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, {signature: signature.toString("base64")});
        const signedHLSSI = newSignedHashLinkSSI.getIdentifier(true);

        // const verificationRes = await $$.promisify(crypto.verifySignature)(seedSSI, dataToSign, signature, Buffer.from(publicKey, "base64"));
        // console.log(anchorID);
        // console.log(Buffer.from(anchorSSI.getControlString(), "base64").toString("hex"))
        // console.log(signedHLSSI);
        let v = eth.getV(signatureHex, Buffer.from(publicKey, "base64").toString("hex"), dataToSign);
        let result;
        try {

            const command = await contractResult.methods.testValidateSignature(anchorID, signedHLSSI, v);
            try {
                result = await command.send({
                    from: accounts[0],
                    gas: estimatedGas
                });

                console.log(signatureHex);
                // console.log(result.events.Result.returnValues.str);
                // console.log(result.events.UIntResult.returnValues.str);
                // console.log(result.events.Bytes32Result.returnValues.str);
                console.log(result.events.BoolResult.returnValues.str);
                // const expectedEncoding = Buffer.Buffer.from(testString).toString("base64");
                // assert.equal(Buffer.Buffer.from(result.events.Result.returnValues.str.slice(2), "hex").toString(), expectedEncoding);

            } catch (e) {
                console.log("Error at sending data to smart contract", e)
            }

        } catch (e) {
            console.log("Error at encoding", e)
        }
    });

});
