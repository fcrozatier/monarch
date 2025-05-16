import { repeat } from "../combinators/iteration/mod.ts";
import { parseErrors } from "../errors.ts";
import type { Parser } from "../index.ts";
import { take } from "./mod.ts";

/**
 * Parses the next two characters
 */
export const takeTwo: Parser<string> = repeat(take, 2).map((arr) => arr.join("")
).error(parseErrors.takeTwoError);
