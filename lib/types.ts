import type { Parser } from "../src/parser/main.ts";

/**
 * Unpacks an array of parsers types
 */
export type Unpack<T> = {
  [K in keyof T]: T[K] extends Parser<infer A> ? A : never;
};

/**
 * Represents a predicate function
 *
 * @internal
 */
export type Predicate = (input: string) => boolean;
