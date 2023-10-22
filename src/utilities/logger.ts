import { createLogger, format, transports } from 'winston';

export default createLogger({
  level: 'info',
  format: format.combine(
    format.json(),
    format.errors({ stack: true }),
    format.timestamp(),
    format.prettyPrint()
  ),
  transports: [new transports.Console()]
});
