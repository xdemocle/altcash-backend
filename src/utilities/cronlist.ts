import cron from 'node-cron';
import graphQLClient from './grapql-client';
// import logger from './logger';
import { queryCheckAndExecuteOrderQueue, queryImportAndCheckOrders } from './queries';

export const runCron = () => {
  // importAndCheckOrders
  cron.schedule('*/5 * * * * *', async () => {
    await graphQLClient.request(queryImportAndCheckOrders);

    setTimeout(async () => {
      await graphQLClient.request(queryCheckAndExecuteOrderQueue);
    }, 1500)
    // logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
    // logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
  });

  // Orders queue processing
  // cron.schedule('*/15 * * * * *', async () => {
  // });
}
