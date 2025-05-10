import type { Parser } from "../../src/index.ts";
import { sepBy } from "../combinators/iteration/sepBy.ts";
import { bracket } from "../combinators/sequencing/bracket.ts";
import { token } from "./token.ts";

/**
 * Builds a parser that expects the list syntax [p(,p)*]
 */
export function listOf<T>(parser: Parser<T>): Parser<T[]> {
  return bracket(
    token("["),
    sepBy(parser, token(",")),
    token("]"),
  );
}
