import { createParser, type Parser } from "../../../src/index.ts";

/**
 * Filters a parser with a predicate and matches only if the predicate returns true
 *
 * Preserves `zero` and distributes over alternation
 *
 * @example
 *
 * ```ts
 * const isVowel = (char) => ["a", "e", "i", "o", "u", "y"].includes(char);
 * const vowel = filter(take, isVowel).error("Expected a vowel");
 *
 * const { results } = vowel.parse("a");
 * // [{value: 'a', remaining: '', ...}]
 *
 * const { message } = vowel.parse("b");
 * // "Expected a vowel"
 * ```
 *
 * @see {@linkcode regex}
 */
export const filter = <T>(
  parser: Parser<T>,
  predicate: (value: T) => boolean,
): Parser<T> => {
  return createParser((input, position) => {
    const result = parser.parse(input, position);

    if (!result.success) return result;

    const results = result.results.filter((r) => predicate(r.value));

    if (results.length === 0) {
      return {
        success: false,
        message: "Expected to match against predicate",
        position,
      };
    }
    return { success: true, results };
  });
};
