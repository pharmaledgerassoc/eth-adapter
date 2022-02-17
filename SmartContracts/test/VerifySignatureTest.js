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
const crypto = require("pskcrypto");
const fs = require('fs');
const solc = require('solc');
// const Buffer = require("buffer");

let contractConnection;
let contract;
let contractResult;
let accounts;

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
        const source = fs.readFileSync('./contracts/VerifySignature.sol', 'utf8');
        var input = {
            language: 'Solidity',
            sources: {
                'VerifySignature.sol': {
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
        const contrbase = compileRes.contracts['VerifySignature.sol']['VerifySignature'];
        const abiInterface = contrbase.abi;
        const bytecode = contrbase.evm.bytecode.object;
        accounts = await web3.eth.getAccounts();
        console.log("About to deploy contract");
        try {
            contractConnection = await new web3.eth.Contract(abiInterface);
            contract = contractConnection.deploy({data: bytecode});
            contractResult = await contract.send({from: accounts[0], gas: 3000000}, function (err, res) {
            })
        } catch (e) {
            console.log("Error at deploy", e);
        }
    } catch (err) {
        console.log(err);
    }

});

describe('VerifySignatureTest', () => {


    // it('deploys a contract', () => {
    //     assert.ok(contractResult.options.address);
    // });

    it('verify', async () => {
        let NO_TESTS = 1000;
        for (let i = 0; i < NO_TESTS; i++) {

            const data = crypto.hash("sha256", "some data", "hex");
            const keyPair = crypto.generateKeyPair();
            const signature = crypto.signETH(Buffer.from(data), keyPair.privateKey);
            const signatureHex = '0x' + signature.toString("hex");
            const publicKeyHex = '0x' + keyPair.publicKey.toString("hex");
            const ecGenerator = crypto.createKeyPairGenerator();
            const pemKey = ecGenerator.convertPrivateKey(keyPair.privateKey);
            let result;
            try {
                const command = await contractResult.methods.validateSignature(data, signatureHex, publicKeyHex);
                try {
                    result = await command.send({
                        from: accounts[0],
                        gas: 3000000
                    });

                    assert.equal(result.events.Result.returnValues.str, true)
                    // const expectedEncoding = Buffer.Buffer.from(testString).toString("base64");
                    // assert.equal(Buffer.Buffer.from(result.events.Result.returnValues.str.slice(2), "hex").toString(), expectedEncoding);

                } catch (e) {
                    console.log("Error at sending data to smart contract", e)
                }

            } catch (e) {
                console.log("Error at encoding", e)
            }
        }

        // const DOMAIN = 'default';
        // const keySSISpace = opendsu.loadApi("keyssi");
        // const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN,  'v0', 'hint');
        // // const publicKeyRaw = seedSSI.getPublicKey("raw");
        // const anchorID = seedSSI.getAnchorId();
        // const crypto = opendsu.loadAPI("crypto");
        // const publicKey = keySSISpace.parse(anchorID).getControlString();
        // const timestamp = Date.now();
        // const brickMapHash = "hash";
        // //sign(hash(anchorId, hash Brick Map, lastEntryInAnchor, timestamp), privateKey Owner)
        // const dataToSign = crypto.sha256(anchorID + brickMapHash + timestamp);
        // const signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
        // const newSignedHashLinkSSI = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, signature);
        //
        // let result;
        // try {
        //     const command = await contractResult.methods.verifySignature(dataToSign, publicKey);
        //     try {
        //         result = await command.send({
        //             from: accounts[0],
        //             gas: 3000000
        //         });
        //
        //         console.log(result);
        //         // const expectedEncoding = Buffer.Buffer.from(testString).toString("base64");
        //         // assert.equal(Buffer.Buffer.from(result.events.Result.returnValues.str.slice(2), "hex").toString(), expectedEncoding);
        //
        //     } catch (e) {
        //         console.log("Error at sending data to smart contract", e)
        //     }
        //
        // } catch (e) {
        //     console.log("Error at encoding", e)
        // }
        // const NO_TESTS = 100;
        // for (let i = 0; i < NO_TESTS; i++) {
        //     const len = Math.floor(Math.random() * 33) + 1;
        //     const testString = crypto.generateRandom(len).toString("hex");
        //     let result;
        //     try {
        //         const command = await contractResult.methods.testEncoding(testString);
        //         try {
        //             result = await command.send({
        //                 from: accounts[0],
        //                 gas: 3000000
        //             });
        //
        //             const expectedEncoding = Buffer.Buffer.from(testString).toString("base64");
        //             assert.equal(Buffer.Buffer.from(result.events.Result.returnValues.str.slice(2), "hex").toString(), expectedEncoding);
        //
        //         } catch (e) {
        //             console.log("Error at sending data to smart contract", e)
        //         }
        //
        //     } catch (e) {
        //         console.log("Error at encoding", e)
        //     }
        //
        // }
    }).timeout(100000);

});
