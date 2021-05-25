function check(anchorFactory, callback) {

    anchorFactory.methods.Check().call().then((invokeResult) => {
        console.log('finished check invoke :', invokeResult);
        callback(undefined,invokeResult);
    }).catch(err => {
        console.log(err);
        callback(err, undefined);
    });
}


module.exports = check;
