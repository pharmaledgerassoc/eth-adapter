function totalNumberOfAnchors(anchorFactory, callback) {
    anchorFactory.methods.totalNumberOfAnchors().call().then((f) => {
        callback(null, f);
    }).catch(err => {
        console.log(err);
        callback(err, null);
    });
}


module.exports = totalNumberOfAnchors;