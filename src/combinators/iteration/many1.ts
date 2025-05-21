import { many } from "./many.ts";
import type { Parser } from "$core";
import { result } from "$core";

/**
 * Returns the longest matching parse array (1 or more matches)
 *
 * @see {@linkcode many}
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.flatMap((x) =>
    many(parser).flatMap((rest) => result([x, ...rest]))
  );
};
