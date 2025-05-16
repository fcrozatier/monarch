import { assertEquals } from "@std/assert/equals";
import { letter } from "./mod.ts";
import { parseErrors } from "../errors.ts";

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
