const redis = require("redis");
require("dotenv").config();

const redisClient = redis.createClient({
  password: process.env.REDIS_PASSWORD,
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
});

const connectRedis = async () => {
  try {
    await redisClient.connect();
    console.log("Redis Connected!");
  } catch (error) {
    console.error("Redis connection error:", error);
  }
};

module.exports = { redisClient, connectRedis };
