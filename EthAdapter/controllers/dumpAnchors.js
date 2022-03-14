function dumpAnchors(anchorFactory) {
    return function (request, response, next) {
        const body = request.body;
        console.log("body received : ", body);
        require("../anchoring/dumpAnchorsSmartContract")(anchorFactory.contract, body.from, body.limit, body.maxSize, (err, result) => {
            if (err) {
                console.log("response dumpAnchors 500");
                return response.status(500).send(err);
            }
            console.log("response dumpAnchors 200", result);
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
    }
}

module.exports = dumpAnchors;