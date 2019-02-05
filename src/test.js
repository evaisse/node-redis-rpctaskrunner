const dotenv = require('dotenv').config({ silent: true});
const redis = require('redis');



redis.createClient({
    url: process.env.REDIS_URL
});