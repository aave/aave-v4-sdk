import schemaData from './schema.json';

/**
 * GraphQL schema introspection data for the Aave API.
 * This contains the complete schema structure including types, fields, and enums.
 *
 * @example
 * ```typescript
 * import { schema } from '@aave/graphql/schema';
 *
 * // Access schema information
 * const queryType = schema.__schema.queryType;
 * const types = schema.__schema.types;
 * ```
 */
export const schema = schemaData;

export default schema;
