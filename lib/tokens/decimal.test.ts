import { assertEquals } from "@std/assert";
import { decimal } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

Deno.test("decimal", () => {
  assertEquals(decimal.parse("2.3 and more"), {
    success: true,
    results: [{
      value: 2.3,
      remaining: "and more",
      position: { line: 1, column: 4 },
    }],
  });

  assertEquals(decimal.parse("23 and more"), {
    success: false,
    message: parseErrors.decimal,
    position: { line: 1, column: 0 },
  });

  assertEquals(decimal.parse("-2.3 and more"), {
    success: true,
    results: [{
      value: -2.3,
      remaining: "and more",
      position: { line: 1, column: 5 },
    }],
  });
});
