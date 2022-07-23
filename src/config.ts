import dotenv from 'dotenv';

dotenv.config();

export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export const CMC_PRO_API_KEY = process.env.CMC_PRO_API_KEY;

export const BINANCE_API_URL = process.env.BINANCE_API_URL;

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY;

export const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;

const getRedisOptions = () => {
  const redisOptions: { tls?: { rejectUnauthorized: boolean } } = {};

  if (process.env.NODE_ENV === 'production') {
    redisOptions.tls = {
      rejectUnauthorized: false,
    };
  }

  return redisOptions;
};

export const REDIS_OPTIONS = getRedisOptions();
