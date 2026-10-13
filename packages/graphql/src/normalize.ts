import type { AnyVariables } from '@aave/types';
import {
  type DocumentNode,
  Kind,
  type OperationDefinitionNode,
  type TypeNode,
} from 'graphql';
import { inputDefaults } from './defaults';

/**
 * @internal
 */
export type InputDefaults = Record<
  string,
  {
    defaults: Record<string, unknown>;
    fields: Record<string, string>;
  }
>;

function namedTypeOf(type: TypeNode): string {
  return type.kind === Kind.NAMED_TYPE
    ? type.name.value
    : namedTypeOf(type.type);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeValue(value: unknown, typeName: string): unknown {
  const type = inputDefaults[typeName];
  if (!type) return value;

  if (Array.isArray(value)) {
    let changed = false;
    const items = value.map((item) => {
      const normalized = normalizeValue(item, typeName);
      if (normalized !== item) changed = true;
      return normalized;
    });
    return changed ? items : value;
  }

  if (!isPlainObject(value)) return value;

  let changed = false;
  const result: Record<string, unknown> = { ...value };

  for (const [key, fallback] of Object.entries(type.defaults)) {
    // An explicit null is kept: GraphQL treats it differently from an omitted field
    if (result[key] === undefined) {
      result[key] = fallback;
      changed = true;
    }
  }

  for (const [key, fieldType] of Object.entries(type.fields)) {
    const field = result[key];
    if (field === undefined || field === null) continue;

    const normalized = normalizeValue(field, fieldType);
    if (normalized !== field) {
      result[key] = normalized;
      changed = true;
    }
  }

  return changed ? result : value;
}

/**
 * Fills in schema defaults for input fields the caller left out, so equivalent
 * requests share the same operation key and cache entry, and every request
 * carries the defaults of the SDK version that built it.
 *
 * @internal
 */
export function normalizeVariables<TVariables extends AnyVariables>(
  document: DocumentNode,
  variables: TVariables,
): TVariables {
  if (!isPlainObject(variables)) return variables;

  const operation = document.definitions.find(
    (definition) => definition.kind === Kind.OPERATION_DEFINITION,
  ) as OperationDefinitionNode | undefined;
  if (!operation) return variables;

  let changed = false;
  const result: Record<string, unknown> = { ...variables };

  for (const definition of operation.variableDefinitions ?? []) {
    const name = definition.variable.name.value;
    if (!(name in result)) continue;

    const normalized = normalizeValue(
      result[name],
      namedTypeOf(definition.type),
    );
    if (normalized !== result[name]) {
      changed = true;
      result[name] = normalized;
    }
  }

  return changed ? (result as TVariables) : variables;
}
