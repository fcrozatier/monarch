/**
 * Example parser for CSV files
 */

import { parseErrors } from "../errors.ts";
import {
  bracket,
  first,
  foldL1,
  many1,
  type Parser,
  result,
  sepBy,
} from "../index.ts";
import { digit } from "./common.ts";
import { letters, literal, regex } from "./common.ts";

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

const spaces = regex(/ */);
const newline = regex(/\n/);

const token = (value: string): Parser<string> => {
  return literal(value).bind((l) => spaces.bind(() => result(l)));
};

const string = bracket(literal('"'), letters, literal('"'));
const natural: Parser<number> = foldL1(
  digit,
  result((a: number, b: number) => 10 * a + b),
).error(parseErrors.natural);

const item = first<string | number>(string, natural);

export const headings: Parser<string[]> = sepBy(
  string,
  token(","),
).bind((headings) => newline.bind(() => result(headings)));

const header: Parser<
  (row: (string | number)[]) => Record<string, string | number>
> = headings.map(
  (headings) => (row: (string | number)[]) =>
    Object.fromEntries(zip(headings, row)),
);

export const row = sepBy(item, token(",")).bind((row) =>
  newline.bind(() => result(row))
);
export const rows = many1(row);

export const csv: Parser<Record<string, string | number>[]> = header.bind((
  makeEntry,
) => rows.bind((rows) => result(rows.map(makeEntry))));
