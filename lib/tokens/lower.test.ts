import { assertEquals } from "@std/assert";
import { lower, repeat } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

const twoLower = repeat(lower, 2).map((letters) => letters.join("")).error(
  "Expected two lowercase letters",
);

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
