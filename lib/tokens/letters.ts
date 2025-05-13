import type { Parser } from "../../src/parser/main.ts";
import { many0 } from "../combinators/iteration/many0.ts";
import { letter } from "./letter.ts";

/**
 * Parses a string of letters
 */
export const letters: Parser<string> = many0(letter).map((letters) =>
  letters.join("")
);
