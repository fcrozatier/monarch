import { regex } from "$common";
import { parseErrors } from "../errors.ts";
import { createParser, type Parser } from "$core";
import { updatePosition } from "../utils.ts";

/**
 * Consumes the next character of the input and fails if the input is empty.
 *
 * @example Non-empty input
 *
 * ```ts
 * const { results } = anyChar.parse("hello");
 * // [{value: 'h', remaining: 'ello', ...}]
 * ```
 *
 * @example Empty input
 *
 * ```ts
 * const { message } = anyChar.parse("");
 * // "Unexpected end of input"
 * ```
 */
export const anyChar: Parser<string> = createParser(
  (input, position) => {
    if (input.length === 0) {
      return {
        success: false,
        message: parseErrors.takeError,
        position,
      };
    }

    const consumed = input[0];
    const newPosition = updatePosition(position, consumed);

    return {
      success: true,
      results: [{
        value: consumed,
        position: newPosition,
        remaining: input.slice(1),
      }],
    };
  },
);

/**
 * Parses zero or more alphanumeric characters
 *
 * Regex: \w*
 */
export const alphaNums: Parser<string> = regex(/^\w*/);

/**
 * Parses a single lower case letter
 *
 * Regex: [a-z]
 */
export const lower: Parser<string> = regex(/^[a-z]/).error(parseErrors.lower);

/**
 * Parses a single upper case letter
 *
 * Regex: [A-Z]
 */
export const upper: Parser<string> = regex(/^[A-Z]/).error(parseErrors.upper);

/**
 * Parses a single letter (case insensitive)
 *
 * Regex: [a-zA-Z]
 */
export const letter: Parser<string> = regex(/^[a-zA-Z]/).error(
  parseErrors.letter,
);

/**
 * Parses zero or more letters
 *
 * Regex: [a-zA-Z]*
 */
export const letters: Parser<string> = regex(/^[a-zA-Z]*/);

/**
 * Parses an identifier as letter + alphanums
 */
export const identifier: Parser<string> = letter.flatMap((l) =>
  alphaNums.map((rest) => l + rest)
);
