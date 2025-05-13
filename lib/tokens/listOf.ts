import type { Parser } from "../../src/parser/main.ts";
import { sepBy0 } from "../combinators/iteration/sepBy0.ts";
import { bracket } from "../combinators/sequencing/bracket.ts";
import { token } from "./token.ts";

/**
 * Builds a parser that expects the list syntax [p(,p)*]
 */
export function listOf<T>(parser: Parser<T>): Parser<T[]> {
  return bracket(
    token("["),
    sepBy0(parser, token(",")),
    token("]"),
  );
}
