import { createParser, type Parser } from "./parser.ts";

/**
 * The default embedding of a value in the Parser monad
 *
 * Succeeds without consuming any of the input string
 */
export const result = <T>(value: T): Parser<T> => {
  return createParser((
    remaining,
    position,
  ) => ({ success: true, results: [{ value, remaining, position }] }));
};
