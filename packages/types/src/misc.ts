import type { Primitive, Tagged } from 'type-fest';

/**
 * A void value.
 */
export type Void = Tagged<undefined, 'Void'>;

/**
 * An opaque pagination cursor.
 */
export type Cursor = Tagged<string, 'Cursor'>;

/**
 * A JSON value.
 */
export type JSONString = Tagged<string, 'JSONString'>;

/**
 * Beautify the  readout of all of the members of that intersection.
 *
 * @see https://twitter.com/mattpocockuk/status/1622730173446557697
 *
 * @internal
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Create a deep version of a type where all properties keep their original
 * required or optional status, but their values can also be `null` or `undefined`.
 *
 * Works recursively on:
 * - **Objects:** Keeps required/optional keys; adds `null | undefined` to each value.
 * - **Arrays:** Applies recursively to each element, allowing `null | undefined`.
 * - **Tuples:** Preserves tuple shape; each element allows `null | undefined`.
 * - **Primitives:** Becomes `T | null | undefined`.
 *
 * @example
 * type Example = {
 *   user: {
 *     name: string;
 *     tags: string[];
 *   };
 * };
 *
 * type Result = NullishDeep<Example>;
 * // {
 * //   user: {
 * //     name: string | null | undefined;
 * //     tags: Array<string | null | undefined> | null | undefined;
 * //   } | null | undefined;
 * // }
 */
export type NullishDeep<T> = T extends ReadonlyArray<infer U>
  ? number extends T['length'] // array
    ? ReadonlyArray<NullishDeep<U> | null | undefined>
    : { readonly [K in keyof T]: NullishDeep<T[K]> | null | undefined } // tuple
  : T extends Array<infer U>
    ? number extends T['length'] // array
      ? Array<NullishDeep<U> | null | undefined>
      : { [K in keyof T]: NullishDeep<T[K]> | null | undefined } // tuple
    : T extends Primitive
      ? T | null | undefined
      : T extends object
        ? { [K in keyof T]: NullishDeep<T[K]> | null | undefined }
        : T | null | undefined;
