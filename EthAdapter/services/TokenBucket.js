/**
 * An implementation of the Token bucket algorithm
 * @param startTokens - maximum number of tokens possible to obtain and the default starting value
 * @param tokenValuePerTime - number of tokens given back for each "unitOfTime"
 * @param unitOfTime - for each "unitOfTime" (in milliseconds) passed "tokenValuePerTime" amount of tokens will be given back
 * @constructor
 */

function TokenBucket(startTokens, tokenValuePerTime, unitOfTime) {
    if (typeof startTokens !== 'number' || typeof tokenValuePerTime !== 'number' || typeof unitOfTime !== 'number') {
        throw new Error('All parameters must be of type number');
    }

    if (isNaN(startTokens) || isNaN(tokenValuePerTime) || isNaN(unitOfTime)) {
        throw new Error('All parameters must not be NaN');
    }

    if (startTokens <= 0 || tokenValuePerTime <= 0 || unitOfTime <= 0) {
        throw new Error('All parameters must be greater than 0');
    }

    TokenBucket.ERROR_LIMIT_EXCEEDED = "error_limit_exceeded";
    TokenBucket.ERROR_BAD_ARGUMENT = "error_bad_argument";

    const limits = {};

    function takeToken(userKey, cost, callback = () => {
    }) {
        if (typeof cost !== 'number' || isNaN(cost) || cost <= 0 || cost === Infinity) {
            callback(TokenBucket.ERROR_BAD_ARGUMENT);
            return;
        }

        const userBucket = limits[userKey];

        if (userBucket) {
            userBucket.tokens += calculateReturnTokens(userBucket.timestamp);
            userBucket.tokens -= cost;

            userBucket.timestamp = Date.now();

            if (userBucket.tokens < 0) {
                userBucket.tokens = 0;
                callback(TokenBucket.ERROR_LIMIT_EXCEEDED, 0);
                return;
            }

            return callback(undefined, userBucket.tokens);
        } else {
            limits[userKey] = new Limit(startTokens, Date.now());
            takeToken(userKey, cost, callback);
        }
    }

    function Limit(maximumTokens, timestamp) {
        this.tokens = maximumTokens;
        this.timestamp = timestamp;

        const self = this;

        return {
            set tokens(numberOfTokens) {
                if (numberOfTokens < 0) {
                    numberOfTokens = -1;
                }

                if (numberOfTokens > maximumTokens) {
                    numberOfTokens = maximumTokens;
                }

                self.tokens = numberOfTokens;
            },
            get tokens() {
                return self.tokens;
            },
            timestamp
        };
    }


    function calculateReturnTokens(timestamp) {
        const currentTime = Date.now();

        const elapsedTime = Math.floor((currentTime - timestamp) / unitOfTime);

        return elapsedTime * tokenValuePerTime;
    }

    this.takeToken = takeToken;
}

module.exports = TokenBucket;
