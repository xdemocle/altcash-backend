/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
import { HIGHLIGHT_PROJECT_ID, NODE_ENV } from '../config';
import Sendgrid from './sendgrid';
import pino from 'pino';

const pinoLogger = pino({
  level: 'info',
  transport: {
    targets: [
      {
        target: '@highlight-run/pino',
        options: {
          projectID: HIGHLIGHT_PROJECT_ID
        },
        level: 'info'
      }
    ]
  }
});

class Logger {
  sender = new Sendgrid();

  get timestamp() {
    return new Date().toISOString();
  }

  log(log: any, ...args: any[]) {
    pinoLogger.info(`[${this.timestamp}]`, 'Logger - log: ', log, ...args);
  }

  debug(debug: any, ...args: any[]) {
    pinoLogger.debug(`[${this.timestamp}]`, 'Logger - debug: ', debug, ...args);
  }

  error(error: any, ...args: any[]) {
    const subject = 'Logger - error: ';

    if (NODE_ENV !== 'development') {
      this.sendError(JSON.stringify(error), subject);
    }

    pinoLogger.error(`[${this.timestamp}]`, subject, Error(error), ...args);
  }

  info(info: any, ...args: any[]) {
    const subject = 'Logger - info: ';

    if (NODE_ENV !== 'development') {
      this.sendInfo(JSON.stringify(info), subject);
    }

    pinoLogger.info(`[${this.timestamp}]`, subject, info, ...args);
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
