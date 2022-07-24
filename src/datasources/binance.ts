import { RESTDataSource } from 'apollo-datasource-rest';
import { each, filter, find } from 'lodash';
import { Spot } from '@binance/connector';
import {
  BINANCE_API_KEY,
  BINANCE_API_KEY_TESTNET,
  BINANCE_API_SECRET,
  BINANCE_API_SECRET_TESTNET,
  BINANCE_API_URL,
} from '../config';
import { BinanceOrderResponse, Order } from '../types';
import Logger from '../utilities/logger';

const ERROR = {
  notrade: 'Your Binance Account can\'t trade!',
  nofunds: 'Your Binance Account has not enough funds!',
}

class BinanceAPI extends RESTDataSource {
  client: any;
  clientTestnet: any;

  constructor() {
    super();

    this.baseURL = BINANCE_API_URL + '/api/v3/';

    this.client = new (Spot as any)(BINANCE_API_KEY, BINANCE_API_SECRET);

    this.clientTestnet = new (Spot as any)(BINANCE_API_KEY_TESTNET, BINANCE_API_SECRET_TESTNET, {
      baseURL: 'https://testnet.binance.vision',
    });
  }

  async ping(): Promise<Record<string, string>> {
    return await this.get('ping');
  }

  async time(): Promise<Record<string, string>> {
    return await this.get('time');
  }

  async getAllMarkets(): Promise<Record<string, string>> {
    const response = await this.get('exchangeInfo');
    let symbols = response.symbols;

    // Removing not needed ma.'rkets
    symbols = filter(symbols, (market) => {
      return market.quoteAsset === 'BTC';
    });

    return symbols;
  }

  async getMarket(symbol: string): Promise<Record<string, string>> {
    const marketSymbol = `${symbol}BTC`.toUpperCase();
    const response = await this.get(`exchangeInfo?symbol=${marketSymbol}`);

    return response.symbols[0];
  }

  async getAllTickers(): Promise<Record<string, string>> {
    let response = await this.get('ticker/price');

    // Removing not needed markets
    response = filter(response, (coin) => {
      // This way we detect btcusdt and others ex. CHRBTC
      return coin.symbol.search('BTC') >= 3;
    });

    each(response, (coin) => {
      coin.id = coin.symbol = coin.symbol.replace('BTC', '');
    });

    return response;
  }

  async getTicker(symbol: string): Promise<Record<string, string>> {
    const marketSymbol = `${symbol}BTC`.toUpperCase();

    return await this.get(`ticker/price?symbol=${marketSymbol}`);
  }

  async getSummary(symbol: string): Promise<Record<string, string>> {
    const marketSymbol = `${symbol}BTC`.toUpperCase();

    return await this.get(`ticker/24hr?symbol=${marketSymbol}`);
  }

  async getAccountData(): Promise<Record<string, string>> {
    const response = await this.client.account();
    // console.debug('getAccountData', response.data);
    return response.data;
  }

  async postOrder(order: Order): Promise<BinanceOrderResponse> {
    const accountData = await this.getAccountData();

    if (!accountData.canTrade) {
      Logger.error(`Binance.postOrder: ${ERROR.notrade}`);
      throw new Error(`Binance.postOrder: ${ERROR.notrade}`);
    }

    const accountBalance = find(accountData.balances as any, { asset: 'BTC' });
    // Logger.debug(`accountBalance: ${JSON.stringify(accountBalance)}`);

    let apiResponse = null;

    // Check if account has funds
    if (Number(accountBalance.free) > 0.0006) {
      // make the order
      try {
        apiResponse = await this.clientTestnet.newOrder('XRPBTC', 'BUY', 'MARKET', {
          // price: '0.001',
          // timeInForce: 'GTC'
          quantity: 20,
        });
      } catch (error) {
        let err = error;

        if (error && error.response && error.response.data) {
          err = error.response.data;
        }

        throw new Error(`Binance.postOrder: ${JSON.stringify(err)}`);
      }
    } else {
      throw new Error(`Binance.postOrder: ${ERROR.nofunds} ${JSON.stringify(accountBalance)}`);
    }

    return apiResponse;
  }
}

export default BinanceAPI;
