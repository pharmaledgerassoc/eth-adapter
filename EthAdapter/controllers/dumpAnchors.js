module.exports = function (request, response, next) {
    const params = request.query;

    require("../services/anchoringService").dumpAnchors(params.from, params.limit, params.maxSize, (err, result) => {
        if (err) {
            console.log("response dumpAnchors 500");
            return response.status(500).send(err);
        }
        let anchors = result;
        const anchorsObjsArray = [];
        for (let i = 0; i < anchors.length; i++) {
            const anchorObj = {
                anchorId: anchors[i][0],
                anchorValues: anchors[i][1]
            };
            anchorsObjsArray.push(anchorObj);
        }
        return response.status(200).send(JSON.stringify(anchorsObjsArray));
    });
};