import { each } from 'lodash';
import { DataSources, OrderQueue } from '../types';
import logger from '../utilities/logger';

// Resolvers define the technique for fetching the types defined in the schema.
const resolvers = {
  Query: {
    getQueues: async (
      _: unknown,
      __: unknown,
      { dataSources }: { dataSources: DataSources }
    ) => {
      return await dataSources.ordersQueueAPI.getOrders();
    },
    getQueue: async (
      _root: unknown,
      { id }: { id: string },
      { dataSources }: { dataSources: DataSources }
    ) => {
      return await dataSources.ordersQueueAPI.getOrder(id);
    },
    importAndCheckOrders: async (
      _root: unknown,
      __: unknown,
      { dataSources }: { dataSources: DataSources }
    ) => {
      const checkPendingPaidOrders =
        await dataSources.ordersAPI.checkPendingPaidOrders();

      return await dataSources.ordersQueueAPI.importAndCheckOrders(
        checkPendingPaidOrders
      );
    },
    checkAndExecuteOrderQueue: async (
      _root: unknown,
      __: unknown,
      { dataSources }: { dataSources: DataSources }
    ) => {
      const queue = await dataSources.ordersQueueAPI.getQueues();
      const ordersExecutedNotFilled: OrderQueue[] = [];

      each(queue, (orderQueue) => {
        if (
          orderQueue.isExecuted === true &&
          orderQueue.isFilled !== true &&
          orderQueue.hasErrors !== true
        ) {
          ordersExecutedNotFilled.push(orderQueue);
        }
      });

      if (ordersExecutedNotFilled.length > 0) {
        logger.info(
          `checkExecutedNotFilled ${String(ordersExecutedNotFilled.length)}`
        );
      }

      return await dataSources.ordersQueueAPI.executeOrders(
        ordersExecutedNotFilled
      );
    }
  }
  // Mutation: {
  // }
};

export default resolvers;
