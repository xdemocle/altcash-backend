import { MongoDataSource } from 'apollo-datasource-mongodb';
import { ObjectId } from 'bson';
import { isUndefined } from 'lodash';
import { Order, OrderParams, UpdateOrderParams } from '../types';
import { getNewRandomPin } from '../utilities';
import logger from '../utilities/logger';

class OrdersAPI extends MongoDataSource<Order> {
  async getOrders(): Promise<Order[] | null> {
    const orders = await this.model.find();

    orders.map((order) => {
      order.timestamp = (order._id as any).getTimestamp();
      return order;
    });

    return orders;
  }

  async getOrder(id: string) {
    const order = await this.model.findById(id);
    const response = JSON.parse(JSON.stringify(order));

    response.timestamp = (order!._id as any).getTimestamp();

    return response;
  }

  async createOrder(amount: string, total: string, symbol: string) {
    const newOrder = {
      amount,
      total,
      symbol,
      email: '',
      pin: getNewRandomPin(),
      isPending: true, // True by default
      isPaid: false,
      isWithdrawn: false,
      isCancelled: false,
      wallet: '',
      reference: '',
      orderReferences: [] as string[]
    };

    return await this.model.create(newOrder);
  }

  async updateOrder(id: string, input: OrderParams) {
    this.deleteFromCacheById(id);

    const updatedOrder: UpdateOrderParams = {};

    if (input.email) {
      updatedOrder.email = input.email;
    }

    if (!isUndefined(input.isPaid)) {
      if (input.isPaid) {
        logger.info(`Order id ${id} is paid.`);
      }

      updatedOrder.isPaid = input.isPaid;
    }

    if (!isUndefined(input.isPending)) {
      updatedOrder.isPending = input.isPending;
    }

    if (!isUndefined(input.isWithdrawn)) {
      updatedOrder.isWithdrawn = input.isWithdrawn;
    }

    if (!isUndefined(input.isCancelled)) {
      updatedOrder.isCancelled = input.isCancelled;
    }

    if (input.wallet) {
      updatedOrder.wallet = input.wallet;
    }

    if (input.reference) {
      updatedOrder.reference = input.reference;
    }

    if (input.orderReferences) {
      const order = await this.getOrder(id);
      const orderOrderReferences = order.orderReferences || [];
      updatedOrder.orderReferences = [
        ...orderOrderReferences,
        ...input.orderReferences
      ];
    }

    // If there is something for real to update
    if (Object.keys(updatedOrder).length > 0) {
      await this.collection.updateOne(
        {
          _id: new ObjectId(id) as any
        },
        {
          $set: updatedOrder
        }
      );
    }

    return await this.getOrder(id);
  }

  async checkPendingPaidOrders(): Promise<Order[] | null> {
    const orders = await this.getOrders();
    const pendingOrders: Order[] = [];

    orders.forEach((order) => {
      if (order.isPending === true && order.isPaid === true) {
        pendingOrders.push(order);
      }
    });

    return pendingOrders;
  }
}

export default OrdersAPI;
