import { createParser, type Parser } from "$core";

/**
 * Defers evaluation, without memoization
 *
 * This helps with undeclared variable references in recursive grammars
 *
 * @example Simple expression parser
 *
 * The following `factor` parser is an integer or a parenthesized expression and `lazy`
allows us to lazily evaluate this parser definition to avoid directly referencing `expr` which is not yet defined.
 *
 * ```ts
 * const add = literal("+").map(() => (a: number, b: number) => a + b);
 * const mul = literal("*").map(() => (a: number, b: number) => a * b);
 *
 * // integer | (expr)
 * const factor = lazy(() =>
 *   alt(
 *     integer,
 *     between(
 *       literal("("),
 *       expr,
 *       literal(")"),
 *     ),
 *   )
 * );
 * const term = foldL(factor, mul);
 * const expr = foldL(term, add);
 *
 * expr.parse("1+2*3"); // results: [{value: 7, remaining: ""}]
 * ```
 *
 * @see {@linkcode memoize}
 */
export const lazy = <T>(parserThunk: () => Parser<T>): Parser<T> => {
  return createParser((input, position) => {
    return parserThunk().parse(input, position);
  });
};
