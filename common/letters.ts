import { many } from "../combinators/iteration/mod.ts";
import { letter } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses many letters
 */
export const letters: Parser<string> = many(letter).map((letters) =>
  letters.join("")
);
