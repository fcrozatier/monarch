import type { Predicate } from "../types.ts";

/**
 * Returns a predicate function from a regex that can be used with the {@linkcode filter} combinator.
 *
 * Prefer using the {@linkcode regex} parser for filter string parsers
 *
 * @example
 *
 * ```ts
 * const isVowel = regexPredicate(/[aeiouy]/);
 * const vowel = filter(take, isVowel).error("Expected a vowel");
 * vowel.parse("allo"); // [{value: 'a', remaining: 'llo', ...}]
 *
 * // vowel is equivalent to
 * const vowel2 = regex(/[aeiouy]/);
 * ```
 *
 * @see {@linkcode regex}
 */
export function regexPredicate(regex: RegExp): Predicate {
  return (input: string) => regex.test(input);
}
