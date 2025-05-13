import { assertEquals } from "@std/assert";
import { take } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

Deno.test("item", () => {
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
