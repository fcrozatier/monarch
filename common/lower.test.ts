import { assertEquals } from "@std/assert";
import { lower } from "./mod.ts";
import { parseErrors } from "../errors.ts";
import { twoLower } from "../tests/common.test.ts";

Deno.test("lower", () => {
  assertEquals(lower.parse("Hello"), {
    success: false,
    message: parseErrors.lower,
    position: { line: 1, column: 0 },
  });

  assertEquals(twoLower.parse("abcd"), {
    success: true,
    results: [{
      value: "ab",
      remaining: "cd",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(twoLower.parse("aBcd"), {
    success: false,
    message: "Expected two lowercase letters",
    position: { line: 1, column: 0 },
  });
});
