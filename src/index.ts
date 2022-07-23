import express from 'express';
import http from 'http';
import cron from 'node-cron';
import OrdersAPI from './datasources/orders';
import OrdersQueueAPI from './datasources/orders-queue';
import OrderModel from './models/orders';
import OrderQueueModel from './models/orders-queue';
import { instanceServer } from './utilities/apollo';
import { connectMongo } from './utilities/db';

// We connect mongoose to our local mongodb database
connectMongo()
  .then(() => {
    // Start crons
    cron.schedule('*/5 * * * * *', async () => {
      const ordersApi = new OrdersAPI(OrderModel);
      const ordersQueueApi = new OrdersQueueAPI(OrderQueueModel);

      ordersQueueApi.importAndCheckOrders(
        await ordersApi.checkPendingPaidOrders()
      );
    });

    console.debug('🎉 connected to MongoDB database successfully')
  })
  .catch((error) => console.error(error));

// We start Apollo GraphQL Server
async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const server = instanceServer(httpServer);

  await server.start();

  server.applyMiddleware({ app });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: process.env.PORT || 4000 }, resolve)
  );

  console.debug(`🚀 Apollo ready at http://localhost:4000${server.graphqlPath}`);
}

startApolloServer();
