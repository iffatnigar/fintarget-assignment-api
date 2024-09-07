import redisClient from "./redisClient.js";
import logger from "./taskLogger.js";
import { v4 as uuidv4 } from "uuid";
import { processQueue } from "./taskProcessor.js";

export function rateLimiter({ limit, duration }) {
  return async (req, res, next) => {
    const { user_id } = req.body;
    const endpoint = req.originalUrl;
    const redisKey = `${endpoint}:${user_id}`;
    const queueKey = `${redisKey}:queue`;

    try {
      const requests = await redisClient.get(redisKey);

      if (requests && parseInt(requests) >= limit) {
        const taskId = uuidv4();
        const task = JSON.stringify({
          taskId,
          user_id,
          endpoint,
          timestamp: new Date().toISOString(),
        });
        await redisClient.rpush(queueKey, task);
        logger.warn(
          `${user_id} Rate limit exceeded: Task queued with Task ID ${taskId}`
        );

        res.status(202).json({
          status: "success",
          message: `User ID = ${user_id}, Task ID = ${taskId}, Queued for processing...`,
        });

        processQueue(endpoint, user_id, duration, limit);
      } else {
        await redisClient
          .multi()
          .incr(redisKey)
          .expire(redisKey, duration)
          .exec();

        logger.info(`Request allowed: User ID ${user_id} for ${endpoint}`);
        next();
      }
    } catch (err) {
      console.error("Rate limiter error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };
}
