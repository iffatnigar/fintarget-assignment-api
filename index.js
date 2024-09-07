import express from "express";
import cluster from "cluster";
import os from "os";
import { rateLimiter } from "./rateLimiter.js";
import logger from "./taskLogger.js";
import { PORT } from "./config.js";

function createServer() {
  const app = express();

  app.use(express.json());

  app.post(
    "/api/v1/task",
    rateLimiter({ limit: 1, duration: 10 }),
    (req, res) => {
      const { user_id } = req.body;

      if (!user_id) {
        res
          .status(400)
          .json({ status: "failed", message: "Please provide user_id" });
        return;
      }

      const message = `${user_id}-task completed at-${Date.now()}`;
      logger.info(message);
      console.log(message);

      res.status(200).json({
        status: "success",
        message: "Task processed successfully...",
      });
      logger.info(
        `[Success] User ID: ${user_id}, ${req.ip} accessed ${req.originalUrl}`
      );
    }
  );

  const port = PORT;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  console.log(`Primary worker ${process.pid} running...`);

  for (let i = 0; i < Math.min(numCPUs, 2); i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker) => {
    console.log(`Worker ${worker.process.pid} died, restarting...`);
    cluster.fork();
  });
} else {
  createServer();
  console.log(`Worker ${process.pid} started`);
}
