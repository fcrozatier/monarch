import { type Parser, result } from "$core";
import { alt } from "$combinators";

/**
 * Tries a parser or defaults to `undefined`.
 * @param parser The parser.
 * @returns A parser returning the successful parse result or `undefined`.
 *
 * @example Option function parameter default
 *
 * In a TypeScript syntax like `function foo(x: number = 42) {}`, both the type annotation and the default value are optional
 *
 * ```ts
 * const param = seq(
 *   identifier,
 *   optional(seq(token(':'), typeExpr)),
 *   optional(seq(token('='), expr))
 * )
 *
 * ```
 *
 * @example Optional trailing comma
 *
 * In many languages tailing commas or semi-colons are optional
 *
 * ```ts
 * const array = between(
 *   token('['),
 *   sepBy(parser, token(",")).skipTrailing(optional(token(','))),
 *   token(']')
 * );
 * ```
 */
export const optional = <T>(parser: Parser<T>): Parser<T | undefined> => {
  return alt(parser, result(undefined));
};
