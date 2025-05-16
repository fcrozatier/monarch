import { many } from "./many.ts";
import type {  Parser } from "../../index.ts";
import { result } from "../../primitives/result.ts";

/**
 * Returns the longest matching parse array (1 or more matches)
 *
 * @see {@linkcode many}
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.bind((x) => many(parser).bind((rest) => result([x, ...rest])));
};
