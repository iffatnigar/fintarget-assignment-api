import redisClient from "./redisClient.js";
import logger from "./taskLogger.js";
import { v4 as uuidv4 } from "uuid";
import { processQueue } from "./taskProcessor.js";

export function rateLimiter({ limit, duration }) {
  return async (req, res, next) => {
    const ip = req.ip;
    const endpoint = req.originalUrl;
    const redisKey = `${endpoint}:${ip}`;
    const queueKey = `${redisKey}:queue`;

    try {
      const requests = await redisClient.get(redisKey);

      if (requests && parseInt(requests) >= limit) {
        const taskId = uuidv4();
        const task = JSON.stringify({
          taskId,
          ip,
          endpoint,
          user_id: req.body.user_id,
          timestamp: new Date().toISOString(),
        });
        await redisClient.rpush(queueKey, task);
        logger.warn(`Rate limit exceeded: Task queued with ID ${taskId}`);

        res.status(202).json({
          status: "success",
          message: `Task ID = ${taskId} -> Queued for processing...`,
        });

        processQueue(endpoint, ip, duration, limit);
      } else {
        await redisClient
          .multi()
          .incr(redisKey)
          .expire(redisKey, duration)
          .exec();

        logger.info(`Request allowed: ${ip} for ${endpoint}`);
        next();
      }
    } catch (err) {
      console.error("Rate limiter error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
