import { assertEquals } from "@std/assert";
import { digit, first, letter } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

Deno.test("first", () => {
  assertEquals(first(digit, letter).parse("1a"), {
    success: true,
    results: [{
      value: 1,
      remaining: "",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(first(digit, letter).parse("12"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 1 },
  });

  assertEquals(first(digit, letter).parse("ab"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
