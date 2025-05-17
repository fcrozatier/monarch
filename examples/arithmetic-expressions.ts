/**
 * Simple interpreter for arithmetic expressions
 *
 * @module
 */

import { alt } from "../combinators/alternation/mod.ts";
import { between, foldL1, foldR1 } from "../combinators/sequencing/mod.ts";
import { literal, number } from "../common/mod.ts";
import { lazy, type Parser } from "../index.ts";

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
