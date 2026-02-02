import type { Operation } from '@urql/core';
import { Kind, type OperationDefinitionNode } from 'graphql';

/**
 * @internal
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
