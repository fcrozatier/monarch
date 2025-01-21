/**
 * Example parser for CSV files
 */

import { bracket, first, type Parser, result, sepBy } from "../index.ts";
import { integer, letters, token } from "./common.ts";

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

const string = bracket(token('"'), letters, token('"'));
const item = first<string | number>(integer, string);

const header: Parser<
  (row: (string | number)[]) => Record<string, (string | number)>
> = sepBy(
  string,
  token(","),
).map((headings) => (row: (string | number)[]) => {
  return Object.fromEntries(zip(headings, row));
});

const row = sepBy(item, token(","));
const rows = sepBy(row, token(";"));

export const csv: Parser<Record<string, string | number>[]> = header.bind((
  makeEntry,
) => rows.bind((rowsOfData) => result(rowsOfData.map(makeEntry))));
