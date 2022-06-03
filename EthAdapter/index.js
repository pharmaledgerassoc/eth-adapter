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

function configureHeaders(server) {
    server.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Length, X-Content-Length');
        res.setHeader('Access-Control-Allow-Origin', '*');
        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Length, X-Content-Length');
        next();
    });
}

function boot() {
    const port = 3000;
    const config = require("./utils/config");
    const express = require('express');
    
    let server = express();

    server.listen(port);

    configureHeaders(server);

    //the following line is not really necessary but prevents a bug related to the fact we need to require web3 before opendsu bundle
    require("./services/transactionManager").getInstance();

    server.use("*", requestBodyJSONMiddleware);

    const createAnchorHandler = require("./controllers/createAnchor");
    server.put("/createAnchor/:anchorId/:anchorValue", createAnchorHandler);

    const appendAnchorHandler = require("./controllers/appendAnchor");
    server.put("/appendAnchor/:anchorId/:anchorValue", appendAnchorHandler);

    const createOrUpdateMultipleAnchorsHandler = require("./controllers/createOrUpdateMultipleAnchors");
    server.put("/createOrAppendMultipleAnchors/*", createOrUpdateMultipleAnchorsHandler);

    const getAllVersionsHandler = require("./controllers/getAllVersions");
    server.get("/getAllVersions/:anchorId", getAllVersionsHandler);

    const getLastVersionHandler = require("./controllers/getLastVersion");
    server.get("/getLastVersion/:anchorId", getLastVersionHandler);

    const totalNumberOfAnchors = require("./controllers/totalNumberOfAnchors");
    server.get("/totalNumberOfAnchors/*", totalNumberOfAnchors);

    const dumpAnchors = require("./controllers/dumpAnchors");
    server.get("/dumpAnchors/*", dumpAnchors);

    console.log('EthAdapter is ready. Listening on port', port);
}

boot();