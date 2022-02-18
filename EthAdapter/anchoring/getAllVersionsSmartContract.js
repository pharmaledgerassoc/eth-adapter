const {parseSSI} = require("../utils/opendsuutils");
function getAllVersions(anchorFactory, anchorID, callback) {
    if (typeof anchorID === "string") {
        anchorID = parseSSI(anchorID);
    }

    anchorID = anchorID.getIdentifier(true);
    console.log("anchorID", anchorID);
    console.log("anchorFactory methods", anchorFactory.methods)
    anchorFactory.methods.getAllVersions(anchorID).call().then((f) => {
        console.log('finished get anchors :', anchorID, f);
        callback(null, f);
    }).catch(err => {
        console.log(err);
        callback(err, null);
    });
}


module.exports = getAllVersions;