import { createParser, type Parser } from "../../../src/parser/main.ts";
import { sortPosition } from "../../../src/utilities.ts";

/**
 * Returns all matching parses
 */
export const any = <T>(...parsers: Parser<T>[]): Parser<T> => {
  return createParser((input, position) => {
    const results = parsers.map((parser) => parser.parse(input, position));

    if (results.every((r) => r.success === false)) {
      const error = results.sort((a, b) =>
        sortPosition(a.position, b.position)
      )[0];

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
