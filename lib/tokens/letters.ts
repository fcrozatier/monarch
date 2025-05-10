import type { Parser } from "../../src/index.ts";
import { many } from "../combinators/iteration/many.ts";
import { letter } from "./letter.ts";

/**
 * Parses a string of letters
 */
export const letters: Parser<string> = many(letter).map((letters) =>
  letters.join("")
);
