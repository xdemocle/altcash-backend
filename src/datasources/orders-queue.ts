import { MongoDataSource } from 'apollo-datasource-mongodb';
import { ObjectId } from 'bson';
import { isUndefined } from 'lodash';
import {
  OrderQueueParams,
  OrderQueue,
  UpdateOrderQueueParams,
  Order,
  BinanceOrderResponse
} from '../types';
import Logger from '../utilities/logger';

class OrdersQueueAPI extends MongoDataSource<OrderQueue> {
  async getQueues(): Promise<OrderQueue[] | null> {
    const orders = await this.model.find();

    orders.map((order) => {
      order.timestamp = order._id.getTimestamp();
      return order;
    });

    return orders;
  }

  async getQueue(id: string) {
    const order = await this.findOneById(id);
    const response = JSON.parse(JSON.stringify(order));

    response.timestamp = order._id.getTimestamp();

    return response;
  }

  async getQueueByOrderId(orderId: string) {
    const ordersQueue = await this.collection.find({ _id: orderId });
    const response = JSON.parse(JSON.stringify(ordersQueue));

    // response.timestamp = ordersQueue._id.getTimestamp();

    console.debug('getQueueByOrderId', response);

    return response;
  }

  async createQueue(order: Order) {
    return await this.model.create(order);
  }

  updateQueue = async (id: string, input: UpdateOrderQueueParams) => {
    this.deleteFromCacheById(id);

    const updatedQueueOrder = this.getUpdatedQueueOrder(input);

    // If there is something for real to update
    if (Object.keys(updatedQueueOrder).length > 0) {
      return await this.collection.updateOne(
        {
          _id: new ObjectId(id)
        },
        {
          $set: updatedQueueOrder
        }
      );
    }

    return {};
  }

  async updateQueueByOrderId(orderId: string, input: UpdateOrderQueueParams) {
    const updatedQueueOrder = this.getUpdatedQueueOrder(input);

    // If there is something for real to update
    if (Object.keys(updatedQueueOrder).length > 0) {
      const queue = await this.collection.updateOne(
        {
          orderId
        },
        {
          $set: updatedQueueOrder
        }
      );

      return queue;
    }

    return null;
  }

  async executeExchangeOrder(order: Order) {
    const binanceApi = this.context.dataSources.marketsAPI;

    try {
      const postBinanceOrder = await binanceApi.postOrder(order);

      if (postBinanceOrder.statusText === 'OK') {
        const isFilled = postBinanceOrder.data.status === 'FILLED';
        const updatedOrderQueue = await this.updateQueueByOrderId(String(order._id), {
          isExecuted: true,
          isFilled
        });

        // Update order with binance api response
        const updateOrder = await this.updateOrder(order, postBinanceOrder);

        Logger.info(`executeExchangeOrder:\nupdateOrder: ${JSON.stringify(updateOrder)}\nupdatedOrderQueue ${JSON.stringify(updatedOrderQueue)}`);
      }
    } catch (error) {
      Logger.error(`executeExchangeOrder: ${JSON.stringify(error)}`);
    }
  }

  async updateOrder(order: Order, exchangerOrder: BinanceOrderResponse) {
    return await this.context.dataSources.ordersAPI.updateOrder(String(order._id), [JSON.stringify(exchangerOrder.data)]);
  }

  async importAndCheckOrders(orders: Order[]) {
    if (!orders || !orders.length) {
      return [];
    }

    const newOrdersQueue: OrderQueueParams[] = [];
    const queue = await this.getQueues();

    // Check if each order are already present
    orders.forEach(async (order) => {
      const isPresent = queue.find((e) => e.orderId === String(order._id));

      // TODO Check order to exchanger and update order isPending
      // console.log('isPresent', isPresent)

      if (!isPresent) {
        this.executeExchangeOrder(order);

        newOrdersQueue.push({
          orderId: order._id,
          isExecuted: false,
          isFilled: false
        });
      }
    });

    if (newOrdersQueue.length) {
      Logger.debug(`importAndCheckOrders: ${JSON.stringify(newOrdersQueue)}`);
    }

    return this.model.insertMany(newOrdersQueue);
  }

  getUpdatedQueueOrder(input: UpdateOrderQueueParams) {
    const updatedQueueOrder: UpdateOrderQueueParams = {};

    if (input.orderId) {
      updatedQueueOrder.orderId = input.orderId;
    }

    if (!isUndefined(input.isExecuted)) {
      updatedQueueOrder.isExecuted = input.isExecuted;
    }

    if (!isUndefined(input.isFilled)) {
      updatedQueueOrder.isFilled = input.isFilled;
    }

    return updatedQueueOrder;
  }
}

export default OrdersQueueAPI;
