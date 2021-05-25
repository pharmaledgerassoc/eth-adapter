const express = require('express');



function requestBodyJSONMiddleware(request, response, next) {
    /**
     * Prepare headers for response
     */
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

function configureHeaders(webServer) {
    webServer.use(function (req, res, next) {
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

function configureAddAnchorEntryPoints(webServer, config) {
    const factory = require('./anchoring/anchorFactory');
    const anchorFactory = new factory(config.rpcAddress, config.contractAddress, config.abi, config.accountPrivateKey);
    const addAnchorHandler = require("./controllers/addAnchor").createAddAnchorHandler(anchorFactory, config.account);
    webServer.use("/addAnchor/*", requestBodyJSONMiddleware);
    webServer.put("/addAnchor/:keySSI", addAnchorHandler);
}

function configureGetAnchorVersionsEntryPoints(webServer, config) {
    const factory = require('./anchoring/anchorFactory');
    const anchorFactory = new factory(config.rpcAddress, config.contractAddress, config.abi, config.accountPrivateKey);
    const getVersionsHandler = require("./controllers/getVersions")(anchorFactory);
    webServer.use("/getAnchorVersions/*", requestBodyJSONMiddleware);
    webServer.get("/getAnchorVersions/:keySSI", getVersionsHandler);
}

function configureCheckEntryPoints(webServer, config) {
    const factory = require('./anchoring/anchorFactory');
    const anchorFactory = new factory(config.rpcAddress, config.contractAddress, config.abi, config.accountPrivateKey);
    const checkHandler = require("./controllers/check")(anchorFactory);
    webServer.use("/check/*", requestBodyJSONMiddleware);
    webServer.get("/check", checkHandler);
}

module.exports = function () {
    const port = 3000;
    const config = require("./utils/config");
    new config((err, result) => {
        if (err)
        {
            console.log(err);
            process.exit(1);
        }
        const scConfig = result;
        console.log("Configuration file used at runtime : ", scConfig);
        this.webServer = express();

        this.webServer.listen(port);

        configureHeaders(this.webServer);

        configureAddAnchorEntryPoints(this.webServer, scConfig);
        configureGetAnchorVersionsEntryPoints(this.webServer, scConfig);
        configureCheckEntryPoints(this.webServer, scConfig);
        console.log('Server started. Listening on ', port);
        return this;
    });

};
