import { createParser, type Parser } from "$core";
import { updatePosition } from "../utils.ts";

/**
 * Creates a parser matching against a given regex
 *
 * @example
 *
 * ```ts
 * import { regex } from '@fcrozatier/monarch/common';
 *
 * const even = regex(/^[02468]/).error("Expected an even number");
 *
 * even.parse("24");
 * // [{value: '2', remaining: '4', ...}]
 *
 * even.parse("13");
 * // "Expected an even number"
 * ```
 */
export function regex(re: RegExp): Parser<string> {
  return createParser((input, position) => {
    const match = input.match(re);

    if (!match) {
      return {
        success: false,
        message: `Expected to match against regex ${re}`,
        position,
      };
    }

    const value = match[0];
    const newPosition = updatePosition(position, value);

    return {
      success: true,
      results: [
        { value, remaining: input.slice(value.length), position: newPosition },
      ],
    };
  });
}
