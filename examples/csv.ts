/**
 * Example parser for CSV files
 *
 * @module
 */

import { alt } from "../combinators/alternation/alt.ts";
import type { Parser } from "../index.ts";
import { result } from "../primitives/result.ts";
import { many1 } from "../combinators/iteration/many1.ts";
import { sepBy } from "../combinators/iteration/sepBy.ts";
import { letters, literal, natural, newline, spaces } from "./common.ts";
import { between } from "../combinators/sequencing/mod.ts";

/**
 * Zips arrays of the same length
 *
 * @example let zipped = zip([1,2], ['a','b']);
 * zipped; // [[1, 'a'], [2, 'b']]
 */
const zip = <T, U>(array1: T[], array2: U[]): [T, U][] => {
  return array1.map((a, i) => {
    return [a, array2[i]];
  });
};

const coma = literal(",").skipTrailing(spaces);
const string = between(literal('"'), letters, literal('"'));
const item = alt<string | number>(string, natural);

/**
 * Parses a csv heading and returns the array of headers
 */
export const headings: Parser<string[]> = sepBy(string, coma).skipTrailing(
  newline,
);

const header: Parser<
  (row: (string | number)[]) => Record<string, string | number>
> = headings.map(
  (headings) => (row: (string | number)[]) =>
    Object.fromEntries(zip(headings, row)),
);

/**
 * Parses a csv row and returns the items array
 */
export const row: Parser<(string | number)[]> = sepBy(item, coma).skipTrailing(
  newline,
);
const rows = many1(row);

/**
 * Parses a csv file
 */
export const csv: Parser<Record<string, string | number>[]> = header.bind((
  makeEntry,
) => rows.bind((rows) => result(rows.map(makeEntry))));
