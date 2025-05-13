import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/parser/main.ts";
import { foldL1 } from "../combinators/iteration/foldL1.ts";
import { first } from "../combinators/sequencing/first.ts";
import { result } from "../primitives/result.ts";
import { digit } from "./digit.ts";
import { spaces } from "./spaces.ts";

/**
 * Parses a natural number
 */
export const natural: Parser<number> = first(
  foldL1(
    digit,
    result((a: number, b: number) => 10 * a + b),
  ),
  spaces,
).error(parseErrors.natural);
