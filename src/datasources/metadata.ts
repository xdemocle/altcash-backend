import { RESTDataSource } from 'apollo-datasource-rest';
import { each } from 'lodash';
import { CMC_PRO_API_KEY } from '../config';
import { Metadata } from '../types';

class MetadataAPI extends RESTDataSource {
  constructor() {
    super();
    this.baseURL = 'https://pro-api.coinmarketcap.com/v2';
  }

  willSendRequest(request: {
    headers: { set: (arg0: string, arg1: string) => void };
  }): void {
    request.headers.set('X-CMC_PRO_API_KEY', CMC_PRO_API_KEY);
  }

  async getCoin(symbol: string): Promise<Metadata> {
    const response = await this.get(
      `cryptocurrency/info?symbol=${symbol.toLowerCase()}`
    );

    return response.data[symbol.toUpperCase()]
      ? response.data[symbol.toUpperCase()][0]
      : { id: '0' };
  }

  async missingData(): Promise<Metadata[]> {
    // const symbols = 'AR,ETH,EOS,FCT,GO,NEO,SG,SMBSWAP,TFC'
    const symbols = 'IOTA';
    const response = await this.get(`cryptocurrency/info?symbol=${symbols}`);

    const arr: Metadata[] = [];

    each(response.data, (value, key) => {
      arr.push({
        id: key,
        metadataId: value.id,
        symbol: key,
        name: value.name,
        slug: value.slug,
        description: value.description,
        logo: value.logo,
      });
    });

    return arr;
  }
}

export default MetadataAPI;
