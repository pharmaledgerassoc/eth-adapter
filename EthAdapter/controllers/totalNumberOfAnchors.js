function createTotalNumberOfAnchorsHandler(anchorFactory) {
    return function (request, response, next) {
        require("../anchoring/totalNumberofVersionsSmartContract")(anchorFactory.contract, (err, result) => {
            if (err) {
                console.log("response totalNumberOfAnchors 500");
                return response.status(500).send(err);
            }
            console.log("response totalNumberOfAnchors 200", result);
            return response.status(200).send(result);
        });
    }
}

module.exports = createTotalNumberOfAnchorsHandler;