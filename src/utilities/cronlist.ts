import graphQLClient from './grapql-client';
import logger from './logger';
import {
  queryCheckAndExecuteOrderQueue,
  queryImportAndCheckOrders
} from './queries';

export const runCron = () => {
  // importAndCheckOrders
  setInterval(async () => {
    const query: { importAndCheckOrders: [] } = await graphQLClient.request(
      queryImportAndCheckOrders
    );

    if (!!query.importAndCheckOrders.length) {
      logger.debug(
        `importAndCheckOrders ${JSON.stringify(query.importAndCheckOrders)}`
      );
    }
  }, 5000);

  // checkAndExecuteOrderQueue
  setInterval(async () => {
    const query: { checkAndExecuteOrderQueue: [] } =
      await graphQLClient.request(queryCheckAndExecuteOrderQueue);

    if (!!query.checkAndExecuteOrderQueue.length) {
      logger.debug(
        `checkAndExecuteOrderQueue ${JSON.stringify(
          query.checkAndExecuteOrderQueue
        )}`
      );
    }
  }, 15000);
};
