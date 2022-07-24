import express from 'express';
import http from 'http';
import { runCron } from './utilities/cronlist';
import { connectMongo } from './utilities/db';
import { instanceServer } from './utilities/apollo';
import { SERVER_HTTP_HOSTNAME, SERVER_HTTP_PORT } from './config';

// We connect mongoose to our local mongodb database
connectMongo()
  .then(() => {
    // Start crons
    runCron();

    console.debug('🎉 Connected to MongoDB database successfully');
  })
  .catch((error) => console.error(error));

// export let httpServer: http.Server = null;

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

  console.debug(`🚀 Apollo ready at http://${SERVER_HTTP_HOSTNAME}:${SERVER_HTTP_PORT}${server.graphqlPath}`);
}

startApolloServer();
