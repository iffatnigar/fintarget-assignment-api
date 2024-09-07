import Redis from "ioredis";
import { REDIS_HOST, REDIS_PASSWORD, REDIS_PORT } from "./config.js";

const redisClient = (() => {
  const client = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  });
  client.on("connect", () => {
    console.log("Redis Connected");
  });
  client.on("error", (err) => {
    console.error("Redis error:", err);
  });
  return client;
})();

export default redisClient;
