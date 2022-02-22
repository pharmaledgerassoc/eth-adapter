function createOrAppendMultipleAnchorsHandler(anchorFactory, account) {
    return function (request, response, next) {

        const anchorID = request.params.keySSI;
        const body = request.body;
        console.log("body received : ", body);

        require("../anchoring/createOrUpdateMultipleAnchorsSmartContract")(anchorFactory, account,
            body,
            (err, result) => {

                if (err) {
                    console.log("------------------------------------------------------")
                    console.log("response createOrAppendMultipleAnchors 428. Error : ", err);
                    console.log({anchorID, body});
                    console.log("------------------------------------------------------")
                    return response.status(428).send("Smart contract invocation failed");
                }
                console.log("response createOrAppendMultipleAnchors 200", anchorID);
                return response.status(200).send(result);
            })
    }
}

module.exports = createOrAppendMultipleAnchorsHandler;