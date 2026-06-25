import dotenv from 'dotenv';

dotenv.config();

export const DEBUG =
  process.env.DEBUG === 'true' ||
  process.env.LOG_LEVEL === 'debug' ||
  process.env.LOG_LEVEL === 'trace';

export const DEFAULT_IGNORE_AFTER_MINUTES = process.env.IGNORE_AFTER_MINUTES
  ? parseInt(process.env.IGNORE_AFTER_MINUTES)
  : 5;