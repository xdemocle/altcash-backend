import { GraphQLClient, gql } from 'graphql-request';
import { SERVER_HTTP_PORT } from '../config';

export { gql }

export default new GraphQLClient(`http://localhost:${SERVER_HTTP_PORT}/graphql`);
