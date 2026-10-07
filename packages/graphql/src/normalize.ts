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

function isEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => isEqual(item, b[i]));
  }

  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = Object.keys(a).filter((key) => a[key] !== undefined);
    return (
      keys.length ===
        Object.keys(b).filter((key) => b[key] !== undefined).length &&
      keys.every((key) => isEqual(a[key], b[key]))
    );
  }

  return false;
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
  const result: Record<string, unknown> = {};

  for (const [key, field] of Object.entries(value)) {
    if (key in type.defaults && isEqual(field, type.defaults[key])) {
      changed = true;
      continue;
    }

    const fieldType = type.fields[key];
    const normalized = fieldType ? normalizeValue(field, fieldType) : field;
    if (normalized !== field) changed = true;
    result[key] = normalized;
  }

  return changed ? result : value;
}

/**
 * Removes input fields whose value equals their schema default, so equivalent
 * requests share the same operation key and cache entry.
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
