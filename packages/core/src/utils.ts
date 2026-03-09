import type { Operation } from '@urql/core';
import { type DocumentNode, Kind, type OperationDefinitionNode } from 'graphql';

/**
 * @internal
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @internal
 */
export function extractDocumentName(document: DocumentNode): string | null {
  const def = document.definitions.find(
    (d) => d.kind === Kind.OPERATION_DEFINITION,
  ) as OperationDefinitionNode | undefined;
  return def?.name?.value ?? null;
}

/**
 * @internal
 */
export function extractOperationName(op: Operation): string | null {
  return extractDocumentName(op.query);
}
