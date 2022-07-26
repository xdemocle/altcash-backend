import graphQLClient from './grapql-client';
// import logger from './logger';
import { queryCheckAndExecuteOrderQueue, queryImportAndCheckOrders } from './queries';

export const runCron = () => {
  // importAndCheckOrders
  setInterval(async () => {
    await graphQLClient.request(queryImportAndCheckOrders);
    // logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
  }, 5000);

  setInterval(async () => {
    await graphQLClient.request(queryCheckAndExecuteOrderQueue);
    // logger.debug(`importAndCheckOrders: ${importAndCheckOrders}`);
  }, 15000);
}
