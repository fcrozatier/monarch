import { assertEquals } from "@std/assert";
import { digit, last, letter } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

Deno.test("last", () => {
  assertEquals(last(digit, letter).parse("1a"), {
    success: true,
    results: [{
      value: "a",
      remaining: "",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(last(digit, letter).parse("12"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 1 },
  });

  assertEquals(last(digit, letter).parse("ab"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
