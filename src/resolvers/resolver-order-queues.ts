import { each, isUndefined } from 'lodash';
import { DataSources, OrderQueue, OrderQueueParams, UpdateOrderQueueParams } from '../types';
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
      const checkPendingPaidOrders = await dataSources.ordersAPI.checkPendingPaidOrders();

      return await dataSources.ordersQueueAPI.importAndCheckOrders(checkPendingPaidOrders);
    },
    checkAndExecuteOrderQueue: async (
      _root: unknown,
      __: unknown,
      { dataSources }: { dataSources: DataSources }
    ) => {
      const queue = await dataSources.ordersQueueAPI.getQueues();
      const ordersExecutedNotFilled: OrderQueue[] = []

      each(queue, (orderQueue) => {
        if (
          orderQueue.isExecuted === true &&
          orderQueue.isFilled !== true &&
          orderQueue.hasErrors !== true
        ) {
          ordersExecutedNotFilled.push(orderQueue);
        }
      })

      logger.log('checkExecutedNotFilled', String(ordersExecutedNotFilled.length));

      return await dataSources.ordersQueueAPI.executeOrders(ordersExecutedNotFilled);
    },
  },
  Mutation: {
    // TODO not supposed to be working
    createQueueOrder: async (
      _root: unknown,
      { orderId, isExecuted, isFilled }: OrderQueueParams,
      { dataSources }: { dataSources: DataSources }
    ) => {
      const sendOrder = await dataSources.ordersQueueAPI.createQueue(
        orderId,
        isExecuted,
        isFilled
      );

      logger.log('createQueueOrder', JSON.stringify(sendOrder));

      return sendOrder;
    },
    updateQueueOrder: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateOrderQueueParams },
      { dataSources }: { dataSources: DataSources }
    ) => {
      const updateOrder = await dataSources.ordersQueueAPI.updateQueue(id, input);

      logger.log('updateQueueOrder', JSON.stringify(updateOrder));

      return updateOrder;
    }
  }
};

export default resolvers;
