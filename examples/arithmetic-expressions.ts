/**
 * Simple interpreter for arithmetic expressions
 *
 * @module
 */

import { bracket, first, foldL1, foldR1, lazy, type Parser } from "../index.ts";
import { literal, number } from "./common.ts";

const addOp = first(
  literal("+").map(() => (a: number, b: number) => a + b),
  literal("-").map(() => (a: number, b: number) => a - b),
);
const mulOp = first(
  literal("*").map(() => (a: number, b: number) => a * b),
  literal("/").map(() => (a: number, b: number) => a / b),
);
const expOp = literal("^").map(() => (a: number, b: number) => a ** b);

// decimal | integer | (expr)
const atom = lazy(() =>
  first(
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
