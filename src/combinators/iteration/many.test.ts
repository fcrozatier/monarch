import { assertEquals } from "@std/assert/equals";
import { many } from "./many.ts";
import { digit } from "../../common/mod.ts";

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
