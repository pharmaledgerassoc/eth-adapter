require("../../../opendsu-sdk/builds/output/openDSU");
openDSURequire('overwrite-require');
const opendsu = openDSURequire("opendsu");
const http = opendsu.loadApi("http");

const ETH_ADAPTER_BASE_URL = "http://localhost:3000";
const DOMAIN = 'ADomainThatDoesntExistMeantJustForTestingCheckEthAdapterTests';

async function createSeedSSI() {
    const keySSISpace = opendsu.loadApi("keyssi");
    const seedSSI = await $$.promisify(keySSISpace.createSeedSSI)(DOMAIN, 'v0');
    return seedSSI;
}

async function getAnchorId(seedSSI, raw = false) {
    const keySSISpace = opendsu.loadApi("keyssi");
    const anchorId = await $$.promisify(seedSSI.getAnchorId)()
    const anchorSSI = keySSISpace.parse(anchorId);
    const anchorID = anchorSSI.getIdentifier(raw);
    return anchorID;
}

async function createNewVersionForAnchor(seedSSI, brickMapHash = "hash1", previousVersion) {
    const crypto = opendsu.loadAPI("crypto");
    const keySSISpace = opendsu.loadAPI("keyssi");
    let timestamp = Date.now() + '';
    let anchorID = await getAnchorId(seedSSI, true);
    let dataToSign = anchorID + brickMapHash + timestamp;
    if (previousVersion) {
        previousVersion = keySSISpace.parse(previousVersion);
        previousVersion = previousVersion.getIdentifier(true);
        dataToSign = anchorID + brickMapHash + previousVersion + timestamp;
    }
    let signature = await $$.promisify(crypto.sign)(seedSSI, dataToSign);
    let signedHashLinkSSI1 = keySSISpace.createSignedHashLinkSSI(DOMAIN, brickMapHash, timestamp, signature.toString("base64"));
    return signedHashLinkSSI1.getIdentifier();
}

let counter = 0

async function readAnchor(anchorId) {
    return fetch(`${ETH_ADAPTER_BASE_URL}/getLastVersion/${anchorId}`).then(res => {
        // console.log("Status code", res.status)
        if (res.status !== 200) {
            throw Error("Throttler limit");
        }
        return new Promise(async (resolve, reject) => {
            let anchorVersion;
            try {
                anchorVersion = await res.text();
            } catch (e) {
                e.details = "True";
                return reject(e);
            }
            if (!anchorVersion) {
                return reject(Error("Content empty"));
            }

            if (anchorVersion.length < 5) {
                return reject(Error("Invalid content"));
            }

            resolve(anchorVersion);
        });
    })
}

async function createAnchorTest(anchorID, anchorVersion) {
    try {
        let doPut = $$.promisify(http.doPut);
        await doPut(`${ETH_ADAPTER_BASE_URL}/createAnchor/${anchorID}/${anchorVersion}`, {});
        console.log(`Created anchor with id ${anchorID} and version ${anchorVersion}`);
    } catch (e) {
        console.trace(e);
        // process.exit(1);
    }
}

// i think DumpAll anchors needs to be a GET with query params. At this moment is a get with a body!!!
//dumpAllAnchorsTest();

const createAnchors = async () => {
    const NO_ANCHORS = 20000;
    const TaskCounter = require("swarmutils").TaskCounter;
    let interval;
    const taskCounter = new TaskCounter(async () => {
        clearInterval(interval);
        console.log("Finished test");
    })
    taskCounter.increment(NO_ANCHORS);
    let dsuIdentifier = await createSeedSSI();
    let anchorId = await getAnchorId(dsuIdentifier);
    let anchorVersion = await createNewVersionForAnchor(dsuIdentifier);
    console.log("AnchorID", anchorId);
    console.log("AnchorVersion", anchorVersion);
    createAnchorTest(anchorId, anchorVersion).then(response => {
        console.time("anchorProcessing")
        let noRequests = 0;
        interval = setInterval(() => {
            readAnchor(anchorId).then((anchorVersion) => {
                noRequests++;
                // console.log(anchorVersion);
                taskCounter.decrement();
            }).catch(err => {
                console.log("====================================================================================")
                console.log(err.message, err.code, noRequests);
                console.log("====================================================================================")
                console.timeEnd("anchorProcessing");
                clearInterval(interval);
            })

        }, 1)
    }).catch(err => {
        console.log(err);
    })
};

createAnchors()