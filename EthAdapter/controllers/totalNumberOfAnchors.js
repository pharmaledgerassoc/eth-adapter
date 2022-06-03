module.exports = function (request, response, next) {
    require("../services/anchoringService").totalNumberOfAnchors((err, result) => {
        if (err) {
            return response.status(500).send(err);
        }
        return response.status(200).send(result);
    });
};