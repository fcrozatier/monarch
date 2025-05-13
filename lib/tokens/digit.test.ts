import { assertEquals } from "@std/assert";
import { digit } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

Deno.test("digit", () => {
  assertEquals(digit.parse("a"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });

  assertEquals(digit.parse("2"), {
    success: true,
    results: [{ value: 2, remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(digit.parse("23"), {
    success: true,
    results: [{ value: 2, remaining: "3", position: { line: 1, column: 1 } }],
  });
});
