const micro = require('micro-whalla');


let client;


module.exports = function (options) {

    if (client) {
        return client;
    }

    client = true;

    micro.init(Object.assign({
        url: process.env.REDIS_URL,
        prefix: 'rpc-task',
        log: true
    }, options));
};
