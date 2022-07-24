import { GraphQLClient, gql } from 'graphql-request';

export { gql }

export default new GraphQLClient('http://localhost:4000/graphql');
