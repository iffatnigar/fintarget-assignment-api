import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logFilePath = path.join(__dirname, "api_logs.log");

const log = (level, message) => {
  const logMessage = `Date: ${new Date().toISOString()} Type: [${level.toUpperCase()}] Message: ${message}\n`;
  fs.appendFileSync(logFilePath, logMessage);
};

const logger = {
  info: (message) => log("info", message),
  warn: (message) => log("warn", message),
  error: (message) => log("error", message),
};

export default logger;
