import { sepBy } from "../combinators/iteration/mod.ts";
import { between } from "../combinators/sequencing/mod.ts";
import type { Parser } from "../index.ts";
import { integer, token } from "./mod.ts";

/**
 * Parses the list syntax [p(,p)*] with square brackets and comma-separated items
 *
 * @param parser The item parser
 *
 * @see {@linkcode between}
 */
export function list<T>(parser: Parser<T>): Parser<T[]> {
  return between(
    token("["),
    sepBy(parser, token(",")),
    token("]"),
  );
}

/**
 * Parses a list of integers
 */
export const listOfInts: Parser<number[]> = list(integer);
