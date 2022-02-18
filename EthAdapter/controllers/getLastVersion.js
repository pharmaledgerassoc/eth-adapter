function createGetLastVersionHandler(anchorFactory) {
    return function (request, response, next) {

        const anchorID = request.params.anchorId;

        require("../anchoring/getLastVersionSmartContract")(anchorFactory.contract, anchorID, (err, result) => {
            if (err) {
                console.log("response getLastVersion 500", anchorID);
                return response.status(500).send(err);
            }
            console.log("response getLastVersion 200", anchorID, result);
            return response.status(200).send(result);
        });
    }
}

module.exports = createGetLastVersionHandler;