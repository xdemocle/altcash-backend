import { DataSources, OrderParams } from '../types';
import logger from '../utilities/logger';

// Resolvers define the technique for fetching the types defined in the
// schema.
const resolvers = {
  Query: {
    getOrders: async (
      _: unknown,
      __: unknown,
      { dataSources }: { dataSources: DataSources }
    ) => {
      return await dataSources.ordersAPI.getOrders();
    },
    getOrder: async (
      _root: unknown,
      { id }: { id: string },
      { dataSources }: { dataSources: DataSources }
    ) => {
      return await dataSources.ordersAPI.getOrder(id);
    }
  },
  Mutation: {
    createOrder: async (
      _root: unknown,
      { amount, total, symbol }: OrderParams,
      { dataSources }: { dataSources: DataSources }
    ) => {
      const sendOrder = await dataSources.ordersAPI.createOrder(
        amount,
        total,
        symbol
      );

      return sendOrder;
    },
    updateOrder: async (
      _: unknown,
      { id, input }: { id: string; input: OrderParams },
      { dataSources }: { dataSources: DataSources }
    ) => {
      const updateOrder = await dataSources.ordersAPI.updateOrder(id, input);

      logger.debug(`updateOrder ${updateOrder}`);

      return updateOrder;
    }
  }
};

export default resolvers;
