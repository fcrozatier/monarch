import type { Parser } from "../src/index.ts";

/**
 * Unpacks an array of parsers types
 */
export type Unpack<T> = {
  [K in keyof T]: T[K] extends Parser<infer A> ? A : never;
};
