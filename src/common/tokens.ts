import type { Parser } from "$core";
import { createParser } from "$core";
import { updatePosition } from "../utils.ts";
import { whitespaces } from "./mod.ts";

/**
 * Matches against a specific character or keyword
 *
 * @example
 *
 * ```ts
 * const dot = literal(".");
 * const { results } = dot.parse(".23");
 * // [{value: '.', remaining: '23', ...}]
 *
 * const { message } = dot.parse("0.23");
 * // "Expected '.' but got '0'"
 * ```
 */
export function literal(value: string): Parser<string> {
  return (createParser((input, position) => {
    if (!input.startsWith(value)) {
      return {
        success: false,
        position,
        message: `Expected '${value}', but got '${
          input.slice(0, value.length) || "EOI"
        }'`,
      };
    }

    return {
      success: true,
      results: [{
        value,
        remaining: input.slice(value.length),
        position: updatePosition(position, value),
      }],
    };
  }));
}

/**
 * Parses a literal and discards trailing spaces
 *
 * @param value The literal value to parse
 * @param trailing The kind of whitespace to skip. Defaults to {@linkcode whitespaces}
 *
 * @see {@linkcode literal}
 */
export function token(value: string, trailing = whitespaces): Parser<string> {
  return literal(value).skipTrailing(trailing);
}
