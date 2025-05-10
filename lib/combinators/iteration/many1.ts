import type { Parser } from "../../../src/index.ts";
import { result } from "../../primitives/result.ts";
import { many } from "./many.ts";

/**
 * Returns the longest matching parse array (1 or more matches)
 */
export const many1 = <T>(parser: Parser<T>): Parser<T[]> => {
  return parser.bind((x) => many(parser).bind((rest) => result([x, ...rest])));
};
