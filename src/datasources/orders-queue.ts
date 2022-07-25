import { MongoDataSource } from 'apollo-datasource-mongodb';
import { ObjectId } from 'bson';
import { each, isUndefined } from 'lodash';
import {
  OrderQueueParams,
  OrderQueue,
  UpdateOrderQueueParams,
  Order,
  BinanceOrderResponse
} from '../types';
import logger from '../utilities/logger';

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
    const ordersQueue = await this.collection.find({ orderId });
    const response = JSON.parse(JSON.stringify(ordersQueue));

    // response.timestamp = ordersQueue._id.getTimestamp();

    return response;
  }

  async createQueue(orderId: string, isExecuted: boolean, isFilled: boolean) {
    return await this.model.create({
      orderId,
      isExecuted,
      isFilled
    });
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
      return await this.collection.updateOne(
        {
          orderId
        },
        {
          $set: updatedQueueOrder
        }
      );
    }

    return null;
  }

  async executeExchangeOrder(order: Order, queue?: OrderQueue) {
    let postBinanceOrder;
    let isFilled = false;
    const binanceApi = this.context.dataSources.marketsAPI;

    try {
      postBinanceOrder = await binanceApi.postOrder(order);

      // Update order with binance api response
      const updateOrderReference = await this.updateOrderReference(order, postBinanceOrder);

      if (postBinanceOrder.statusText === 'OK') {
        isFilled = postBinanceOrder.data.status === 'FILLED';
      } else {
        // Check if previous query was already present and executed
        if (queue && queue.isExecuted) {
          this.markQueueWithError(order);
        }

        logger.error(`executeExchangeOrder:\npostBinanceOrder error: ${JSON.stringify(postBinanceOrder)}`);
      }

      const updatedOrderQueue = await this.updateQueueByOrderId(String(order._id), {
        isExecuted: true,
        isFilled
      });

      logger.log(`executeExchangeOrder:\nupdateOrderReference: ${JSON.stringify(updateOrderReference)}`);
      logger.log(`executeExchangeOrder:\nupdatedOrderQueue ${JSON.stringify(updatedOrderQueue)}`);
    } catch (error) {
      // Check if previous query was already present and executed
      if (queue && queue.isExecuted) {
        this.markQueueWithError(order);
      }

      logger.error(`executeExchangeOrder: ${JSON.stringify(error)}`);
    }

    return postBinanceOrder;
  }

  async updateOrderReference(order: Order, exchangerOrder: BinanceOrderResponse) {
    return await this.context.dataSources.ordersAPI.updateOrder(
      String(order._id),
      {
        orderReferences: [JSON.stringify(exchangerOrder)]
      }
    );
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
      logger.debug(`importAndCheckOrders: ${JSON.stringify(newOrdersQueue)}`);
    }

    return this.model.insertMany(newOrdersQueue);
  }

  async executeOrders(ordersQueue: OrderQueue[]): Promise<OrderQueue[] | null> {
    each(ordersQueue, async (queue) => {
      const order = await this.context.dataSources.ordersAPI.getOrder(queue.orderId);
      this.executeExchangeOrder(order, queue);
    });

    return ordersQueue;
  }

  async markQueueWithError(order: Order) {
    const response = await this.updateQueueByOrderId(String(order._id), {
      hasErrors: true
    });

    return response
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

    if (!isUndefined(input.hasErrors)) {
      updatedQueueOrder.hasErrors = input.hasErrors;
    }

    return updatedQueueOrder;
  }
}

export default OrdersQueueAPI;
