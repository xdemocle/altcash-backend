# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Altcash-backend is a GraphQL-based cryptocurrency exchange backend that integrates with Binance API to facilitate automated crypto trading. The system manages user orders, executes them on Binance exchange, and tracks their status through a queue-based processing system.

## Development Commands

Important note: **We use bun as pkg manager**

### Running the Application

- `bun dev` - Start development server with hot-reload (watches TypeScript files, ignores tests)
- `bun build` - Compile TypeScript to `dist/` and copy schema.graphql
- `bun start` - Alias for build command (note: does not run the server)

### Development Notes

- The dev server uses `nodemon` with `ts-node` to watch and restart on changes
- Port: 4000 (default) or set via `PORT` environment variable
- Build output: `dist/` directory

## Architecture

### GraphQL Server Stack

- **Apollo Server 3** with Express integration
- **Schema-first approach** - GraphQL schema defined in `src/schema.graphql`
- **Response caching** - InMemoryLRUCache (500 items, ~100MiB, 5min TTL)
  - Note: Redis cache is commented out but available in code
- **Cache directives** - Uses `@cacheControl` in schema (e.g., Market: 1hr, Metadata: 7 days)

### Core Data Flow

1. **Entry Point** (`src/index.ts`):

   - Connects to MongoDB
   - Starts cron jobs for order processing
   - Initializes Apollo Server on Express

2. **Order Processing Pipeline**:

   - User creates order via GraphQL mutation → stored in MongoDB
   - **Cron 1** (5s interval): `importAndCheckOrders` - Imports paid orders into queue
   - **Cron 2** (15s interval): `checkAndExecuteOrderQueue` - Executes queued orders on Binance
   - Order queue tracks: `isExecuted`, `isFilled`, `hasErrors`

3. **DataSources** (`src/datasources/`):
   - `BinanceAPI` - Market data and order execution via Binance Spot API
   - `OrdersAPI` - MongoDB operations for Order model
   - `OrdersQueueAPI` - Queue management and Binance order execution logic
   - `MetadataAPI` - Cryptocurrency metadata (CoinMarketCap integration via CMC_PRO_API_KEY)
   - `MybitxAPI`, `NamesAPI` - Additional market data sources

### Key Architecture Patterns

**Order Queue System** (`orders-queue.ts`):

- `executeExchangeOrder()` - Core method that:
  1. Validates Binance account can trade (balance > 0.0006 BTC)
  2. Posts market buy order to Binance
  3. Updates order with Binance response in `orderReferences` array
  4. Marks queue status (`isFilled`, `hasErrors`)
- Each Binance API response is JSON-stringified and appended to order's `orderReferences` array
- Error handling: marks both queue and order with `hasErrors: true`

**Binance Integration**:

- Uses `@binance/connector` SDK for authenticated operations
- Two clients: production and testnet
- All orders are BTC-quoted pairs (filters for `quoteAsset === 'BTC'`)
- Market buy orders only (no limit orders)

**MongoDB Models** (`src/models/`):

- `orders` - User cryptocurrency purchase orders
- `orders-queue` - Execution queue linking to orders by `orderId`

**Resolvers** (`src/resolvers/`):

- Split by domain: markets, orders, order-queues, tickers, summaries, meta, pair, count
- Merged together in `apollo.ts` using `@graphql-tools/merge`

### Configuration (`src/config.ts`)

Environment variables required:

- `NODE_ENV` - Controls logging and Redis TLS
- `PORT` - Server port (default: 4000)
- `SENDGRID_API_KEY` - Email service
- `CMC_PRO_API_KEY` - CoinMarketCap API for metadata
- `BINANCE_API_KEY`, `BINANCE_API_SECRET` - Production Binance credentials
- `BINANCE_API_KEY_TESTNET`, `BINANCE_API_SECRET_TESTNET` - Testnet credentials
- `BINANCE_API_URL` - Binance API base URL
- MongoDB connection string (handled in `utilities/db.ts`)

### Logging

- Uses `winston` logger (see `utilities/logger.ts`)
- In non-development mode: stdout/stderr redirected to `./altcash.log`
- Debug and error levels used throughout

## TypeScript Configuration

- Target: ES2016, CommonJS modules
- Output: `dist/` directory with source maps
- Custom type roots: `src/@types`
- `strict: false` - Type checking is lenient
- `noImplicitAny: true` - Some type safety enforced

## Common Patterns

### Adding a New GraphQL Query/Mutation

1. Define type in `src/schema.graphql`
2. Create resolver in appropriate `src/resolvers/resolver-*.ts`
3. Add resolver to merge list in `src/utilities/apollo.ts`
4. If new data source needed, create in `src/datasources/` and add to `dataSources()` function

### Working with Orders

- Orders flow: Order → OrderQueue → Binance execution
- Always check `hasErrors` flag when debugging failed orders
- `orderReferences` array contains full Binance API response history
- Queue entries are linked by `orderId` (string representation of Order.\_id)

### Cron Jobs

- Defined in `src/utilities/cronlist.ts`
- Uses GraphQL client to query own API (localhost)
- Runs as setInterval, not node-cron library (despite @types/node-cron dependency)

## Important Constraints

- All trading pairs must be BTC-quoted (base/BTC)
- Minimum balance requirement: 0.0006 BTC
- Order type: Market orders only
- Binance account must have `canTrade: true` permission
