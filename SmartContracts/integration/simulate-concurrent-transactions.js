// configure to connect this running instance to a Quorum network
// update .env file with correct info
// run the test to try to simulate concurrent transactions and determine if nonce is managed or not by web3

var keyssi0 = '7saRdSuZc8NuEPhBopUP7qPPj4dS5JxskL5nh1ciBC9EHVgwv765yrqMx71bHx5J1HqAh3C9GfJeAkcqp7NK9'
var sign0='iKx1CJMtGJ9WeVEL4rQKa7De5uyhtt2tRwZssfDt44avSZDxmZScMt7bf443nZGM36F2GzS8WnFvVKmYesFUQNpUW77Du41okt'
var pubkey0='QUFkeBoQ2FacYZsuqUVRdwh4KDuqSBwCmD7dwFVDz954Fv8x1Ea72WRnDsg2vAgica1Gh7emGRSa4jt9zePS7BaN'
var newhl0='tmSV63a6CYGKJSGbbSzawnpNS3mLUWRfL4TZy9Dzsvf7FbUvMVRfTcQ1xxsugi114LxUxJUkpAwEVknqiL5MsRiG5xHwgmEjT7isea2auckKzdTYhGRXzfMtPnGv3KKoDqc9NHL2sJpRBMpNojmrSoj7oorVskXGAFuJRbn7D1FMNMSwqYwc6Evqw2txtXQAtwQSPchK9fDXpX5DWsfdGkPz9wPD1cNRA1dNMvpU2gJzRH2P1GuBipwursTpNB1cSapNBTeBFBk5jSAE9iNNz2ymZhoYWPdseLAbonnYMtNj2zePvX2tsLRruk4QA4XNMFr8xg5WV6rwTxDVNDPLbwpU1DBXS2rHPCDkVVH'
var lhl0=null

var keyssi1 = '7saRdSuZc8NuEPhBopUP7qPPj4dS5JxskL5nh1ciBC9EHVgwv765yrqMx71bHx5J1HqAh3C9GfJeAkcqp7NK9'
var sign1='AN1rKvtjW1qwRgJFeeMf9Ap2G1p5F7vCUDVSQocXnVa1aGZZMmMFbp6UMvVAo3geaxMapfNth76SZ8ioAWUyQhig4GsN9vD9G'
var pubkey1='QUFkeBoQ2FacYZsuqUVRdwh4KDuqSBwCmD7dwFVDz954Fv8x1Ea72WRnDsg2vAgica1Gh7emGRSa4jt9zePS7BaN'
var newhl1='CjEvwcUSCDyVAPVTR7o988n2aYEwQ16qkPCXx6sLQWAnH8uBAC9PXGjC22Erwe5LwXDCEvN78C7DXn6qm7jzq7e9zwvo9n2XUHx6m4HER71JFmu1B6nQ3mxSjmYBRCDEcUFSNfmHHXPrLFevMVShuYvcLscn5KqSxzAiRFJbQCrbWBDPMXwmMuPGYXirkDSkUDLjFaUXfyPEsY7dUcCmp7Rdcoxk5pd56qAriHFpqGyk9PGsUf8Nb4bvF9Trvyq3YqQB5kGjW4d7Ar3UtEpGRxb274B1A71waEpjx7rcG4dGSXUw9byV8fVhPrr8dbTXqUKfD6mu8Cy6iGJM9D81swZSywBgXo3FQbrKcK'
var lhl1='tmSV63a6CYGKJSGbbSzawnpNS3mLUWRfL4TZy9Dzsvf7FbUvMVRfTcQ1xxsugi114LxUxJUkpAwEVknqiL5MsRiG5xHwgmEjT7isea2auckKzdTYhGRXzfMtPnGv3KKoDqc9NHL2sJpRBMpNojmrSoj7oorVskXGAFuJRbn7D1FMNMSwqYwc6Evqw2txtXQAtwQSPchK9fDXpX5DWsfdGkPz9wPD1cNRA1dNMvpU2gJzRH2P1GuBipwursTpNB1cSapNBTeBFBk5jSAE9iNNz2ymZhoYWPdseLAbonnYMtNj2zePvX2tsLRruk4QA4XNMFr8xg5WV6rwTxDVNDPLbwpU1DBXS2rHPCDkVVH'
call1(keyssi0,sign0,pubkey0,newhl0,lhl0);
call1(keyssi1,sign1,pubkey1,newhl1,lhl1);

function call1 (keyssi, sign, pubkey,newhl,lasthl) {
    var http = require("http");

    var options = {
        "method": "PUT",
        "hostname": "a3285cb46a5894ed0be417ec7e970707-1540979264.eu-central-1.elb.amazonaws.com",
        "port": "3000",
        "path": "/addAnchor/" + keyssi,
        "headers": {
            "content-type": "application/json",
            "cache-control": "no-cache",
            "postman-token": "d2ec42ca-2034-9801-ef22-45d604cfb3de"
        }
    };

    var req = http.request(options, function (res) {
        var chunks = [];

        res.on("data", function (chunk) {
            chunks.push(chunk);
        });

        res.on("end", function () {
            var body = Buffer.concat(chunks);
            console.log(body.toString());
        });
    });

    req.write(JSON.stringify({
        hash:
            {
                newHashLinkSSI: newhl,
                lastHashLinkSSI: lasthl
            },
        digitalProof:
            {
                signature: sign,
                publicKey: pubkey
            },
        zkp: ''
    }));
    req.end();

//
}
