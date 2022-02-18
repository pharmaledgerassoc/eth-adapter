function dumpAnchors(anchorFactory, from, limit, maxSize, callback) {
    anchorFactory.methods.dumpAnchors().call().then((f) => {
        console.log('finished get anchors :', f);
        callback(null, f);
    }).catch(err => {
        console.log(err);
        callback(err, null);
    });
}


module.exports = dumpAnchors;