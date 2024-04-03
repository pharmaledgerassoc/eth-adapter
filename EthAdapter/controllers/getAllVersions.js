module.exports = function (request, response, next) {
    const anchorID = request.params.anchorId;
    require("../services/anchoringService").getAllVersions(anchorID, (err, result) => {
        if (err) {
            console.info(`Returning statusCode 500 on ${request.url}`);
            return response.status(500).send(err);
        }
        return response.status(200).send(JSON.stringify(result));
    });
};