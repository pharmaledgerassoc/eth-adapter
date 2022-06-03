module.exports = function (request, response, next) {

    const body = request.body;

    require("../services/anchoringService").createOrUpdateMultipleAnchors(body, (err, result) => {
        if (err) {
            console.group(`createOrAppendMultipleAnchors(${JSON.stringify(body)}) ended with Error:`);
            console.log(err);
            console.groupEnd();
            return response.status(428).send("Smart contract invocation failed");
        }
        console.log("response createOrAppendMultipleAnchors 200");
        return response.status(200).send(result);
    });
};