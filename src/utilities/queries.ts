import { gql } from './grapql-client';

export const queryImportAndCheckOrders = gql`
  query Query {
    importAndCheckOrders {
      orderId
      isExecuted
      isFilled
      hasErrors
    }
  }
`;

export const queryCheckAndExecuteOrderQueue = gql`
  query Query {
    checkAndExecuteOrderQueue {
      orderId
      isExecuted
      isFilled
      hasErrors
    }
  }
`;
