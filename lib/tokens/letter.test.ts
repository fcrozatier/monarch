import { assertEquals } from "@std/assert";
import { letter } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

Deno.test("letter", () => {
  assertEquals(letter.parse("m"), {
    success: true,
    results: [{ value: "m", remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(letter.parse("1"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 0 },
  });
});
