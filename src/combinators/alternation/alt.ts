import { createParser, type Parser } from "$core";
import { sortPosition } from "../../utils.ts";

/**
 * Returns the first successful alternative
 *
 * @example Signed integers
 *
 * ```ts
 * const integer = alt(
 *   literal("-").flatMap(() => natural).map((x) => -x),
 *   literal("+").flatMap(() => natural).map((x) => x),
 *   natural,
 * );
 *
 * integer.parseOrThrow("-42"); // -42
 * integer.parseOrThrow("+42"); // 42
 * integer.parseOrThrow("42"); // 42
 * ```
 */
export const alt = <T>(
  ...parsers: Parser<T>[]
): Parser<T> => {
  return createParser((input, position) => {
    const results = [];
    for (const parser of parsers) {
      const result = parser.parse(input, position);
      if (result.success === true) return result;
      results.push(result);
    }

    const [error] = results.sort((a, b) =>
      sortPosition(a.position, b.position)
    );

    return error;
  });
};
