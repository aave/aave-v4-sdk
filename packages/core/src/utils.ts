import { invariant } from '@aave/types-next';
import type { AnyVariables, Operation, OperationResult } from '@urql/core';
import { Kind, type OperationDefinitionNode } from 'graphql';
import type { StandardData } from './types';

/**
 * @internal
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @internal
 */
export function takeValue<T>({
  data,
  error,
}: OperationResult<StandardData<T> | undefined, AnyVariables>): T {
  invariant(data, `Expected a value, got: ${error?.message}`);
  return data.value;
}

/**
 * @internal
 */
export function extractOperationName(op: Operation): string | null {
  const def = op.query.definitions.find(
    (d) => d.kind === Kind.OPERATION_DEFINITION,
  ) as OperationDefinitionNode | undefined;
  return def?.name?.value ?? null;
}

/**
 * @internal
 */
export function isActiveQueryOperation(op: Operation): boolean {
  return op.kind === 'query' && !op.context.pause;
}

/**
 * @internal
 */
export function isTeardownOperation(op: Operation): boolean {
  return op.kind === 'teardown';
}
