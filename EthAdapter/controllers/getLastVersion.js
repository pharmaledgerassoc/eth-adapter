module.exports = function (request, response, next) {
    const anchorID = request.params.anchorId;
    require("../services/anchoringService").getLastVersion(anchorID, (err, result) => {
        if (err) {
            return response.status(500).send(err);
        }
        return response.status(200).send(result);
    });
};