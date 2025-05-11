import { assertEquals } from "@std/assert";
import { digit, many } from "../../main.ts";

Deno.test("many", () => {
  assertEquals(many(digit).parse("23 and more"), {
    success: true,
    results: [{
      value: [2, 3],
      remaining: " and more",
      position: { line: 1, column: 2 },
    }],
  });

  // Matches 0 or more times
  assertEquals(many(digit).parse("a"), {
    success: true,
    results: [{
      value: [],
      remaining: "a",
      position: { line: 1, column: 0 },
    }],
  });
});
