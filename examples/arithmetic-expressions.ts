/**
 * Simple interpreter for arithmetic expressions
 *
 * @module
 */

import { alt, bracket, foldL1, foldR1, lazy, type Parser } from "../index.ts";
import { literal, number } from "./common.ts";

const addOp = alt(
  literal("+").map(() => (a: number, b: number) => a + b),
  literal("-").map(() => (a: number, b: number) => a - b),
);
const mulOp = alt(
  literal("*").map(() => (a: number, b: number) => a * b),
  literal("/").map(() => (a: number, b: number) => a / b),
);
const expOp = literal("^").map(() => (a: number, b: number) => a ** b);

// decimal | integer | (expr)
const atom = lazy(() =>
  alt(
    number,
    bracket(
      literal("("),
      expr,
      literal(")"),
    ),
  )
);

const factor = foldR1(atom, expOp);
const term = foldL1(factor, mulOp);

export const expr: Parser<number> = foldL1(term, addOp);
