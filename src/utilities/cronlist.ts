import graphQLClient from './grapql-client';
// import logger from './logger';
import { queryCheckAndExecuteOrderQueue, queryImportAndCheckOrders } from './queries';

export const runCron = () => {
  // importAndCheckOrders
  setInterval(async () => {
    await graphQLClient.request(queryImportAndCheckOrders);
    // logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
  }, 5000);

  // checkAndExecuteOrderQueue
  setInterval(async () => {
    await graphQLClient.request(queryCheckAndExecuteOrderQueue);
    // logger.debug(`checkAndExecuteOrderQueue: ${checkAndExecuteOrderQueue}`);
  }, 15000);
}
