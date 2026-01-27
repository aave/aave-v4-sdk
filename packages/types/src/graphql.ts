import { InvariantError } from './helpers';
import type { Override } from './misc';

/**
 * @internal
 */
export type AnySelectionSet = object;

declare const OpaqueTypenameSymbol: unique symbol;

/**
 * @internal
 */
export type OpaqueTypename = { [OpaqueTypenameSymbol]: 'OpaqueTypename' };

/**
 * @internal
 */
export type AnyVariables = Record<string, unknown>;

/**
 * @internal
 */
export type TypedSelectionSet<TTypename extends string = string> = {
  __typename: TTypename;
};

/*
 * Asserts that the node is of a specific type in a union.
 *
 * ```ts
 * type A = { __typename: 'A', a: string };
 * type B = { __typename: 'B', b: string };
 *
 * const node: A | B = { __typename: 'A', a: 'a' };
 *
 * assertTypename(node, 'A');
 *
 * console.log(node.a); // OK
 * ```
 *
 * @param node - The node to assert the typename of
 * @param typename - The expected typename
 */
export function assertTypename<Typename extends string>(
  node: TypedSelectionSet,
  typename: Typename,
): asserts node is TypedSelectionSet<Typename> {
  if (node.__typename !== typename) {
    throw new InvariantError(
      `Expected node to have typename "${typename}", but got "${node.__typename}"`,
    );
  }
}

/**
 * Given a union with a `__typename` discriminant,
 * add an extra "opaque" member so switches can't be exhaustive.
 *
 * Intersects opaque properties with base union members, then adds an opaque
 * union member with `__typename: OpaqueTypename` to prevent exhaustive checking
 * while preserving narrowing behavior.
 *
 * @internal
 */
export type ExtendWithOpaqueType<T extends { __typename: string }> =
  | T
  | Override<T, { __typename: OpaqueTypename }>;

/**
 * @internal
 */
export function extendWithOpaqueType<T extends { __typename: string }>(
  node: T,
): ExtendWithOpaqueType<T> {
  return node;
}
