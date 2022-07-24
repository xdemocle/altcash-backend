import { DataSources, OrderQueueParams, UpdateOrderQueueParams } from '../types';
import Logger from '../utilities/logger';

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
  },
  Mutation: {
    createQueueOrder: async (
      _root: unknown,
      { orderId, isExecuted, isFilled }: OrderQueueParams,
      { dataSources }: { dataSources: DataSources }
    ) => {
      const sendOrder = await dataSources.ordersQueueAPI.createQueue(
        orderId, isExecuted, isFilled
      );

      Logger.info('createQueueOrder', JSON.stringify(sendOrder));

      return sendOrder;
    },
    updateQueueOrder: async (
      _: unknown,
      { id, input }: { id: string; input: UpdateOrderQueueParams },
      { dataSources }: { dataSources: DataSources }
    ) => {
      const updateOrder = await dataSources.ordersQueueAPI.updateQueue(id, input);

      Logger.info('updateQueueOrder', JSON.stringify(updateOrder));

      return updateOrder;
    }
  }
};

export default resolvers;
