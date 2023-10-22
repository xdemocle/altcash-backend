import fs from 'fs';
import express from 'express';
import http from 'http';
import { runCron } from './utilities/cronlist';
import { connectMongo } from './utilities/db';
import { instanceServer } from './utilities/apollo';
import logger from './utilities/logger';
import { NODE_ENV, SERVER_HTTP_PORT } from './config';

if (NODE_ENV !== 'development') {
  const access = fs.createWriteStream('./altcash.log');
  process.stdout.write = process.stderr.write = access.write.bind(access);
}

// We connect mongoose to our local mongodb database
connectMongo()
  .then(() => {
    // Start crons
    runCron();

    logger.debug('🎉 Connected to MongoDB database successfully');
  })
  .catch((error) => logger.error(error));

// We start Apollo GraphQL Server
async function startApolloServer() {
  const app = express();
  const httpServer = http.createServer(app);
  const server = instanceServer(httpServer);

  await server.start();

  server.applyMiddleware({ app });

  await new Promise<void>((resolve) =>
    httpServer.listen({ port: SERVER_HTTP_PORT }, resolve)
  );

  logger.debug(
    `🚀 Apollo ready at http://localhost:${SERVER_HTTP_PORT}${server.graphqlPath}`
  );
}

startApolloServer();
