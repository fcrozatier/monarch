import { sepBy } from "../combinators/iteration/mod.ts";
import { between } from "../combinators/sequencing/mod.ts";
import { token } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses the list syntax [p(,p)*] with square brackets and comma-separated items
 *
 * @param parser The items parser
 */

export function list<T>(parser: Parser<T>): Parser<T[]> {
  return between(
    token("["),
    sepBy(parser, token(",")),
    token("]"),
  );
}
