// import Redis from 'ioredis';
// import { BaseRedisCache } from 'apollo-server-cache-redis';
import { InMemoryLRUCache } from '@apollo/utils.keyvaluecache';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { loadSchemaSync } from '@graphql-tools/load';
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import { ApolloServer } from 'apollo-server-express';
import responseCachePlugin from 'apollo-server-plugin-response-cache';
import { join } from 'path';
import BinanceAPI from '../datasources/binance';
import MetadataAPI from '../datasources/metadata';
import MybitxAPI from '../datasources/mybitx';
import NamesAPI from '../datasources/names';
import OrdersAPI from '../datasources/orders';
import OrderModel from '../models/orders';
import resolverCount from '../resolvers/resolver-count';
import resolverMarkets from '../resolvers/resolver-markets';
import resolverMeta from '../resolvers/resolver-meta';
import resolverOrders from '../resolvers/resolver-orders';
import resolverPair from '../resolvers/resolver-pair';
import resolverSummaries from '../resolvers/resolver-summaries';
import resolverTickers from '../resolvers/resolver-tickers';
// import { REDIS_OPTIONS } from '../config';
import OrdersQueueAPI from '../datasources/orders-queue';
import OrderQueueModel from '../models/orders-queue';
import resolverOrderQueues from '../resolvers/resolver-order-queues';

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
export const typeDefs = loadSchemaSync(join(__dirname, '../schema.graphql'), {
  loaders: [new GraphQLFileLoader()]
});

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
export const instanceServer = (httpServer: any) => {
  return new ApolloServer({
    typeDefs: mergeTypeDefs([typeDefs]),
    resolvers: mergeResolvers([
      resolverMarkets,
      resolverCount,
      resolverMeta,
      resolverPair,
      resolverSummaries,
      resolverTickers,
      resolverOrders,
      resolverOrderQueues
    ]),
    // context: accountsGraphQL.context,
    dataSources: () => ({
      marketsAPI: new BinanceAPI(),
      metadataAPI: new MetadataAPI(),
      namesAPI: new NamesAPI(),
      mybitxAPI: new MybitxAPI(),
      ordersAPI: new OrdersAPI({ modelOrCollection: OrderModel }) as any,
      ordersQueueAPI: new OrdersQueueAPI({ modelOrCollection: OrderQueueModel }) as any
    }),
    // cache: new BaseRedisCache({
    //   client: new Redis(
    //     '127.0.0.1',
    //     REDIS_OPTIONS
    //   ),
    // }),
    cache: new InMemoryLRUCache({
      max: 500,
      // ~100MiB
      maxSize: Math.pow(2, 20) * 100,
      // 5 minutes (in milliseconds)
      ttl: 300_000
    }),
    csrfPrevention: true,
    introspection: true,
    plugins: [
      responseCachePlugin(),
      ApolloServerPluginDrainHttpServer({ httpServer })
    ]
  });
};
