import type { Parser } from "../src/parser.ts";

/**
 * Unwraps tuple of wrapped types into tuple of inner types.
 *
 * @template T Tuple of potentially wrapped types
 */
export type UnwrappedTuple<T extends Parser<unknown>[]> = {
  [K in keyof T]: T[K] extends Parser<infer U> ? U : never;
};

/**
 * Represents a predicate function
 *
 * @internal
 */
export type Predicate = (input: string) => boolean;
