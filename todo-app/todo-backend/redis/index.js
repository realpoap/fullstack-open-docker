const redis = require('redis')
const { REDIS_URL } = require('../util/config')

let client;


if (!REDIS_URL) {
  const redisIsDisabled = () => {
    console.log('No REDIS_URL set, Redis is disabled')
    return null
  }
} else {
  client = redis.createClient({
    url: REDIS_URL
  })
  client.on('error', (err) => console.log('Redis Client Error', err));
  client.on('connect', () => console.log('Redis Client Connected'));
  client.on('ready', () => console.log('Redis Client Ready'));

  // Connect to Redis
  (async () => {
    try {
      await client.connect();
    } catch (error) {
      console.error('Error connecting to Redis:', error);
    }
  })();
}

const getAsync = async (key) => {
  return await client.get(key);
};

const setAsync = async (key, value) => {
  return await client.set(key, value);
};

module.exports = {
  getAsync,
  setAsync
}