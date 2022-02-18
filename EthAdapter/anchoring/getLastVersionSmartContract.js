const {parseSSI} = require("../utils/opendsuutils");

function getLastVersion(anchorFactory, anchorID, callback) {
    if (typeof anchorID === "string") {
        anchorID = parseSSI(anchorID);
    }

    anchorID = anchorID.getIdentifier(true);
    console.log(anchorID)
    anchorFactory.methods.getLastVersion(anchorID).call().then((f) => {
        console.log('finished get last version :', anchorID, f);
        callback(null, f);
    }).catch(err => {
        console.log(err);
        callback(err, null);
    });
}


module.exports = getLastVersion;