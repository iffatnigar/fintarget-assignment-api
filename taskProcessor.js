import redisClient from "./redisClient.js";
import logger from "./taskLogger.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export async function processQueue(endpoint, ip, duration, limit) {
  const redisKey = `${endpoint}:${ip}`;
  const queueKey = `${redisKey}:queue`;
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logFilePath = path.join(__dirname, "tasks.log");

  const interval = setInterval(async () => {
    try {
      const requests = await redisClient.get(redisKey);

      if (!requests || parseInt(requests) < limit) {
        const nextTask = await redisClient.lpop(queueKey);
        if (nextTask) {
          const { taskId, timestamp } = JSON.parse(nextTask);
          await redisClient
            .multi()
            .incr(redisKey)
            .expire(redisKey, duration)
            .exec();

          const logEntry = `${taskId}-task completed at-${timestamp}\n`;
          fs.appendFileSync(logFilePath, logEntry);
          logger.info(`Processed task ${taskId} for ${ip}`);
        } else {
          clearInterval(interval);
        }
      }
    } catch (err) {
      console.error("Task processor error:", err);
    }
  }, 1000);
}
