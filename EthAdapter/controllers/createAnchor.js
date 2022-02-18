function createCreateAnchorHandler(anchorFactory, account) {
    return function (request, response, next) {

        const anchorID = request.params.anchorId;
        const anchorValue = request.params.anchorValue;

        require("../anchoring/createAnchorSmartContract")(anchorFactory, account,
            anchorID,
            anchorValue,
            (err, result) => {

                if (err) {
                    console.log("------------------------------------------------------")
                    console.log("response createAnchor 428. Error : ", err);
                    console.log({anchorID, anchorValue});
                    console.log("------------------------------------------------------")
                    return response.status(428).send("Smart contract invocation failed");
                }
                console.log("response createAnchor 200", anchorID);
                return response.status(200).send(result);
            })
    }
}

module.exports = createCreateAnchorHandler;