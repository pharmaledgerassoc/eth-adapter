function createAppendAnchorHandler(anchorFactory, account) {
    return function (request, response, next) {

        const anchorID = request.params.anchorId;
        const anchorValue = request.params.anchorValue;

        require("../anchoring/appendAnchorSmartContract")(anchorFactory, account,
            anchorID,
            anchorValue,
            (err, result) => {

                if (err) {
                    console.log("------------------------------------------------------")
                    console.log("response appendAnchor 428. Error : ", err);
                    console.log({anchorID, anchorValue});
                    console.log("------------------------------------------------------")
                    return response.status(428).send("Smart contract invocation failed");
                }
                console.log("response appendAnchor 200", anchorID);
                return response.status(200).send(result);
            })
    }
}

module.exports = createAppendAnchorHandler;