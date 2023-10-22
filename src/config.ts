import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), './.env') });

export const NODE_ENV = process.env.NODE_ENV;

export const SERVER_HTTP_PORT = process.env.PORT || 4000;

export const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

export const CMC_PRO_API_KEY = process.env.CMC_PRO_API_KEY;

export const BINANCE_API_URL = process.env.BINANCE_API_URL;

export const BINANCE_API_KEY = process.env.BINANCE_API_KEY;

export const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;

export const BINANCE_API_KEY_TESTNET = process.env.BINANCE_API_KEY_TESTNET;

export const BINANCE_API_SECRET_TESTNET =
  process.env.BINANCE_API_SECRET_TESTNET;

const getRedisOptions = () => {
  const redisOptions: {
    tls?: { rejectUnauthorized: boolean };
    connectTimeout: number;
  } = {
    connectTimeout: 10000
  };

  if (process.env.NODE_ENV === 'production') {
    redisOptions.tls = {
      rejectUnauthorized: false
    };
  }

  return redisOptions;
};

export const REDIS_OPTIONS = getRedisOptions();
