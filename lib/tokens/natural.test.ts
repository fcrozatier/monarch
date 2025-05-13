import { assertEquals } from "@std/assert";
import { natural } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

Deno.test("natural", () => {
  assertEquals(natural.parse("23 and more"), {
    success: true,
    results: [{
      value: 23,
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(natural.parse("and more"), {
    success: false,
    message: parseErrors.natural,
    position: { line: 1, column: 0 },
  });
});
