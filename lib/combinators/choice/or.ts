import { createParser, type Parser } from "../../../src/parser.ts";
import { sortPosition } from "../../../src/utilities.ts";

/**
 * Only returns the first successful parse result
 *
 * @example Signed integers
 *
 * ```ts
 * const integer = or(
 *   literal("-").bind(() => natural).map((x) => -x),
 *   literal("+").bind(() => natural).map((x) => x),
 *   natural,
 * );
 *
 * integer.parse("-42"); // results: [{value: -42, remaining: ''}]
 * integer.parse("+42"); // results: [{value: 42, remaining: ''}]
 * integer.parse("42"); // results: [{value: 42, remaining: ''}]
 * ```
 */
export const or = <T>(
  ...parsers: Parser<T>[]
): Parser<T> => {
  return createParser((input, position) => {
    const results = [];
    for (const parser of parsers) {
      const result = parser.parse(input, position);
      if (result.success === true) return result;
      results.push(result);
    }

    const error = results.sort((a, b) =>
      sortPosition(a.position, b.position)
    )[0];

    return error;
  });
};
