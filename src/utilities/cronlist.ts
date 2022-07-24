import cron from 'node-cron';
import graphQLClient from './grapql-client';
// import Logger from './logger';
import { queryImportAndCheckOrders } from './queries';

export const runCron = () => {
  // importAndCheckOrders
  cron.schedule('*/5 * * * * *', async () => {
    await graphQLClient.request(queryImportAndCheckOrders);
    // Logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
  });

  // Orders queue processing
  // cron.schedule('*/5 * * * * *', async () => {
  //   await graphQLClient.request(queryImportAndCheckOrders);
  //   // Logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
  // });
}
