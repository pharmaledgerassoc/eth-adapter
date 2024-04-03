function requestBodyJSONMiddleware(request, response, next) {
    response.setHeader('Content-Type', 'application/json');

    const data = [];

    request.on('data', (chunk) => {
        data.push(chunk);
    });

    request.on('end', () => {
        let jsonBody = {};
        try {
            jsonBody = data.length ? JSON.parse(data) : {};
        } catch (err) {
            console.log(err);
        }
        request.body = jsonBody;
        next();
    });
}

function boot() {
    const configPath = "./config.json"
    const TokenBucket = require("./services/TokenBucket");
    let config = {
        port: 3000,
        writeTokenBucket: {
            startTokens: 180,
            tokenValuePerTime: 180,
            unitOfTime: 3000
        },
        readTokenBucket: {
            startTokens: 10000,
            tokenValuePerTime: 10,
            unitOfTime: 10
        }
    }
    try {
        config = require(configPath);
    } catch (e) {
        console.log("Could not find config file", configPath);
        console.log("Using default configuration");
    }
    const express = require('express');

    let app = express();
    app.set('etag', false); // turn off

    const writeTokenBucket = new TokenBucket(config.writeTokenBucket.startTokens, config.writeTokenBucket.tokenValuePerTime, config.writeTokenBucket.unitOfTime);
    const readTokenBucket = new TokenBucket(config.readTokenBucket.startTokens, config.readTokenBucket.tokenValuePerTime, config.readTokenBucket.unitOfTime);

    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods allowed
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers allowed
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Length, X-Content-Length');
        next();
    });

    //the following line is not really necessary but prevents a bug related to the fact we need to require web3 before opendsu bundle
    require("./services/transactionManager").getInstance();

    //this require needs to be called after the web3 library require to don't interfere
    require("../../opendsu-sdk/builds/output/openDSU");
    openDSURequire('overwrite-require');

    app.use(requestBodyJSONMiddleware);

    function getThrottlerMiddleware(tokenBucket) {
        return function throttlerMiddleware(req, res, next) {
            tokenBucket.takeToken("*", 1, (err) => {
                if (err) {
                    if (err === TokenBucket.ERROR_LIMIT_EXCEEDED) {
                        res.statusCode = 429;
                        console.info(`Returning statusCode 429 on ${req.url}`);
                    } else {
                        res.statusCode = 500;
                        console.info(`Returning statusCode 500 on ${req.url}`);
                    }

                    res.end();
                    return;
                }
                next();
            });
        }
    }

    const createAnchorHandler = require("./controllers/createAnchor");
    app.put("/createAnchor/:anchorId/:anchorValue", getThrottlerMiddleware(writeTokenBucket));
    app.put("/createAnchor/:anchorId/:anchorValue", createAnchorHandler);

    const appendAnchorHandler = require("./controllers/appendAnchor");
    app.put("/appendAnchor/:anchorId/:anchorValue", getThrottlerMiddleware(writeTokenBucket));
    app.put("/appendAnchor/:anchorId/:anchorValue", appendAnchorHandler);

    const createOrUpdateMultipleAnchorsHandler = require("./controllers/createOrUpdateMultipleAnchors");
    app.put("/createOrAppendMultipleAnchors", getThrottlerMiddleware(writeTokenBucket));
    app.put("/createOrAppendMultipleAnchors", createOrUpdateMultipleAnchorsHandler);

    const getAllVersionsHandler = require("./controllers/getAllVersions");
    app.get("/getAllVersions/:anchorId", getThrottlerMiddleware(readTokenBucket));
    app.get("/getAllVersions/:anchorId", getAllVersionsHandler);

    const getLastVersionHandler = require("./controllers/getLastVersion");
    app.get("/getLastVersion/:anchorId", getThrottlerMiddleware(readTokenBucket));
    app.get("/getLastVersion/:anchorId", getLastVersionHandler);

    const totalNumberOfAnchors = require("./controllers/totalNumberOfAnchors");
    app.get("/totalNumberOfAnchors", getThrottlerMiddleware(readTokenBucket));
    app.get("/totalNumberOfAnchors", totalNumberOfAnchors);

    const dumpAnchors = require("./controllers/dumpAnchors");
    app.get("/dumpAnchors", getThrottlerMiddleware(readTokenBucket));
    app.get("/dumpAnchors", dumpAnchors);

    app.get("/health", function (req, res, next) {
        res.status(200).send("Running");
    });

    let server = app.listen(config.port);

    process.on('SIGTERM', () => {
        console.log('SIGTERM signal received: closing ETH Adapter');
        server.close(() => {
            console.log('ETH Adapter stopped!');
        });
    });

    console.log('EthAdapter is ready. Listening on port', config.port);
}

boot();