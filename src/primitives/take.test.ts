import { assertEquals } from "@std/assert";
import { parseErrors } from "../errors.ts";
import { take } from "./mod.ts";

Deno.test("take", () => {
  assertEquals(take.parse(""), {
    success: false,
    message: parseErrors.takeError,
    position: { line: 1, column: 0 },
  });

  assertEquals(take.parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }],
  });
});
