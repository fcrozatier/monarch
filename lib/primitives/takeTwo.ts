import { parseErrors } from "../../src/errors.ts";
import type { Parser } from "../../src/index.ts";
import { repeat } from "../combinators/iteration/repeat.ts";
import { take } from "./take.ts";

/**
 * Parses the next two characters
 */
export const takeTwo: Parser<string> = repeat(take, 2).map((arr) =>
  arr.join("")
).error(parseErrors.takeTwoError);
