module.exports = function (request, response, next) {

    const body = request.body;

    require("../services/anchoringService").createOrUpdateMultipleAnchors(body, (err, result) => {
        if (err) {
            console.group(`createMultipleAnchors ended with Error:`);
            console.log(err);
            console.groupEnd();
            if (err.code) {
                console.info(`Returning statusCode 428 on ${request.url}`);
                return response.status(428).send("Smart contract invocation failed");
            }
            console.info(`Returning statusCode 408 on ${request.url}`);
            return response.status(408).send("Transaction timeout.");
        }
        console.log("response createOrAppendMultipleAnchors 200");
        return response.status(200).send(result);
    });
};