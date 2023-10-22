/* eslint-disable @typescript-eslint/no-explicit-any */
import { NODE_ENV } from '../config';
import Sendgrid from './sendgrid';
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.json(),
    format.errors({ stack: true }),
    format.timestamp(),
    format.prettyPrint()
  ),
  transports: [new transports.Console()]
});

class Logger {
  sender = new Sendgrid();

  get timestamp() {
    return new Date().toISOString();
  }

  log(log: any, ...args: any[]) {
    logger.info(`[${this.timestamp}]`, 'Logger - log: ', log, ...args);
  }

  debug(debug: any, ...args: any[]) {
    logger.debug(`[${this.timestamp}]`, 'Logger - debug: ', debug, ...args);
  }

  error(error: any, ...args: any[]) {
    const subject = 'Logger - error: ';

    if (NODE_ENV !== 'development') {
      this.sendError(JSON.stringify(error), subject);
    }

    logger.error(`[${this.timestamp}]`, subject, Error(error), ...args);
  }

  info(info: any, ...args: any[]) {
    const subject = 'Logger - info: ';

    if (NODE_ENV !== 'development') {
      this.sendInfo(JSON.stringify(info), subject);
    }

    logger.info(`[${this.timestamp}]`, subject, info, ...args);
  }

  sendError(message: string, subject: string) {
    const request = this.sender.post(message, subject);

    request
      .then((response) => {
        this.log('Logger - sendError response: ', JSON.stringify(response));
      })
      .catch((err: any) => {
        this.error('Logger - sendError error: ', err);
      });

    return request;
  }

  sendInfo(message: string, subject: string) {
    const request = this.sender.post(message, subject);

    request
      .then((response) => {
        this.log('Logger - sendInfo response: ', JSON.stringify(response));
      })
      .catch((err: any) => {
        this.error('Logger - sendInfo error: ', err);
      });

    return request;
  }
}

export default new Logger();
