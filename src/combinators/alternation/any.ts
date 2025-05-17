import { createParser, type Parser } from "$core";
import { sortPosition } from "../../utils.ts";

/**
 * Returns all matching parses
 *
 * @example Parse one or two characters
 *
 * ```ts
 * const oneOrTwoChars = any(take, takeTwo);
 *
 * assertEquals(oneOrTwoChars.parse("monad"), {
 *   success: true,
 *   results: [{
 *     value: "m",
 *     remaining: "onad",
 *     position: { line: 1, column: 1 },
 *   }, {
 *     value: "mo",
 *     remaining: "nad",
 *     position: { line: 1, column: 2 },
 *   }],
 * }
 *
 * ```
 *
 * @example Explore a search space
 *
 * The backtracking behavior of the `any` combinator can be leverage to explore spaces of possibilities
 *
 * ```ts
 * assertEquals(explore.parse("many"), {
 *   success: true,
 *   results: [
 *     {
 *       remaining: "",
 *       value: ["m", "a", "n", "y"],
 *       position: { line: 1, column: 4 },
 *     },
 *     {
 *       remaining: "",
 *       value: ["m", "a", "ny"],
 *       position: { line: 1, column: 4 },
 *     },
 *     {
 *       remaining: "",
 *       value: ["m", "an", "y"],
 *       position: { line: 1, column: 4 },
 *     },
 *     {
 *       remaining: "",
 *       value: ["ma", "n", "y"],
 *       position: { line: 1, column: 4 },
 *     },
 *     { remaining: "", value: ["ma", "ny"], position: { line: 1, column: 4 } },
 *   ],
 *  }
 * ```
 */
export const any = <T>(...parsers: Parser<T>[]): Parser<T> => {
  return createParser((input, position) => {
    const results = parsers.map((parser) => parser.parse(input, position));

    if (results.every((r) => r.success === false)) {
      const [error] = results.sort((a, b) =>
        sortPosition(a.position, b.position)
      );

      return error;
    }

    return {
      success: true,
      results: results.filter((res) => res.success === true).flatMap((r) =>
        r.results
      ),
    };
  });
};
