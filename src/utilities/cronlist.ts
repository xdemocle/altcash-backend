import graphQLClient from './grapql-client';
import logger from './logger';
import { queryCheckAndExecuteOrderQueue, queryImportAndCheckOrders } from './queries';

export const runCron = () => {
  // importAndCheckOrders
  setInterval(async () => {
    const query = await graphQLClient.request(queryImportAndCheckOrders);

    if (!!query.importAndCheckOrders.length) {
      logger.debug(JSON.stringify(query.importAndCheckOrders));
    }
  }, 5000);

  // checkAndExecuteOrderQueue
  setInterval(async () => {
    const query = await graphQLClient.request(queryCheckAndExecuteOrderQueue);

    if (!!query.checkAndExecuteOrderQueue.length) {
      logger.debug(JSON.stringify(query.checkAndExecuteOrderQueue));
    }
  }, 15000);
}
