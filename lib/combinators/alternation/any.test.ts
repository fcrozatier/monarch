import { assertEquals } from "@std/assert";
import { any, take, takeTwo } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

const oneOrTwoItems = any(take, takeTwo);

Deno.test("alternation", () => {
  assertEquals(oneOrTwoItems.parse(""), {
    success: false,
    position: { line: 1, column: 0 },
    message: parseErrors.takeError,
  });

  assertEquals(oneOrTwoItems.parse("m"), {
    success: true,
    results: [{ value: "m", remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(oneOrTwoItems.parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }, {
      value: "mo",
      remaining: "nad",
      position: { line: 1, column: 2 },
    }],
  });
});
