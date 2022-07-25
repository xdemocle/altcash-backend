/* eslint-disable @typescript-eslint/no-explicit-any, no-console */
import { NODE_ENV } from '../config';
import Sendgrid from './sendgrid';

class Logger {
  sender = new Sendgrid();

  get timestamp() {
    return new Date().toISOString();
  }

  log(log: any, ...args: string[]) {
    console.log(`[${this.timestamp}]`, 'Logger - log: ', log, ...args);
  }

  debug(debug: any, ...args: string[]) {
    console.debug(`[${this.timestamp}]`, 'Logger - debug: ', debug, ...args);
  }

  error(error: any, ...args: string[]) {
    const subject = 'Logger - error: ';

    if (NODE_ENV !== 'development') {
      this.sendError(JSON.stringify(error), subject);
    }

    console.error(`[${this.timestamp}]`, subject, Error(error), ...args);
  }

  info(info: any, ...args: string[]) {
    const subject = 'Logger - info: ';

    if (NODE_ENV !== 'development') {
      this.sendInfo(JSON.stringify(info), subject);
    }

    console.info(`[${this.timestamp}]`, subject, info, ...args);
  }

  sendError(message: string, subject: string) {
    const request = this.sender.post(message, subject);

    request
      .then((response) => {
        this.info('Logger - sendError response: ', JSON.stringify(response));
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
        this.info('Logger - sendInfo response: ', JSON.stringify(response));
      })
      .catch((err: any) => {
        this.error('Logger - sendInfo error: ', err);
      });

    return request;
  }
}

export default new Logger();
