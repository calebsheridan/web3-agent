import { createLogger, format, transports } from 'winston';
import path from 'path';
import fs from 'fs';

// Get project root directory (where package.json is)
const projectRoot = process.cwd();
const logsDir = path.join(projectRoot, 'logs');

if (process.env.LOG_TO_FILE === 'true') {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
    console.log(`Created logs directory at: ${logsDir}`);
  }
}

// Add this function before creating the logger
const getLogFileName = () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `app-${timestamp}.log`;
};

const logger = createLogger({
  level: 'debug',
  format: format.combine(
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      )
    })
  ]
});

// Add file transport if LOG_TO_FILE env var is set
if (process.env.LOG_TO_FILE === 'true') {
  const fileTransport = new transports.File({
    filename: path.join(logsDir, getLogFileName()),
    format: format.combine(
      format.timestamp(),
      format.json()
    ),
    maxsize: 5242880, // 5MB
    maxFiles: 5
  });
  
  logger.add(fileTransport);
  
  // Updated log messages to show the actual filename being used
  const currentLogFile = path.join(logsDir, getLogFileName());
  logger.info(`File logging enabled - writing to ${currentLogFile}`);
}

export default logger;
