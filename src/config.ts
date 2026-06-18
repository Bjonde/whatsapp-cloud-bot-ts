import dotenv from 'dotenv';

dotenv.config();

export const DEBUG =
  process.env.DEBUG === 'true' ||
  process.env.LOG_LEVEL === 'debug' ||
  process.env.LOG_LEVEL === 'trace';
