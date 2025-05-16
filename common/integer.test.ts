import { assertEquals } from "@std/assert/equals";
import { integer } from "./mod.ts";
import { parseErrors } from "../errors.ts";

Deno.test("integer", () => {
  assertEquals(integer.parse("23 and more"), {
    success: true,
    results: [{
      value: 23,
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(integer.parse("and more"), {
    success: false,
    message: parseErrors.integer,
    position: { line: 1, column: 0 },
  });

  assertEquals(integer.parse("-23 and more"), {
    success: true,
    results: [{
      value: -23,
      remaining: "and more",
      position: { line: 1, column: 4 },
    }],
  });
});
