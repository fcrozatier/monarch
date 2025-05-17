/**
 * Simple interpreter for arithmetic expressions
 *
 * @module
 */

import { alt, between, foldL1, foldR1, lazy } from "$combinators";
import { literal, number } from "$common";
import type { Parser } from "$core";

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
    between(
      literal("("),
      expr,
      literal(")"),
    ),
  )
);

const factor = foldR1(atom, expOp);
const term = foldL1(factor, mulOp);

export const expr: Parser<number> = foldL1(term, addOp);
