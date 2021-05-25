function createCheckHandler(anchorFactory) {
    return function (request, response, next) {



        require("../anchoring/check")(anchorFactory.contract, (err, result) => {
            if (err) {
                console.log("response check 500", err);
                return response.status(500).send(err);
            }
            console.log("response check 200", result);
            return response.status(200).send(JSON.stringify(result));
        });
    }
}

module.exports = createCheckHandler;
