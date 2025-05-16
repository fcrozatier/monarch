import { assertEquals } from "@std/assert";
import { parseErrors } from "../errors.ts";
import { takeTwo } from "./mod.ts";

Deno.test("take two", () => {
  assertEquals(takeTwo.parse("m"), {
    success: false,
    message: parseErrors.takeTwoError,
    position: { line: 1, column: 0 },
  });

  assertEquals(takeTwo.parse("monad"), {
    success: true,
    results: [{
      value: "mo",
      remaining: "nad",
      position: { line: 1, column: 2 },
    }],
  });
});
