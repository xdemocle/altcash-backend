import { gql } from './grapql-client';

export const queryImportAndCheckOrders = gql`
  query ImportAndCheckOrders {
    importAndCheckOrders {
      orderId
      isExecuted
      isFilled
      timestamp
    }
  }
`;
