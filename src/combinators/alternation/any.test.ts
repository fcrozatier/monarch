import { assertEquals } from "@std/assert";
import { any } from "./any.ts";
import { parseErrors } from "../../errors.ts";
import { take, takeTwo } from "../../primitives/mod.ts";
import { literal } from "../../common/mod.ts";

const oneOrTwoItems = any(take, takeTwo);

Deno.test("any", () => {
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

  const aOrB = any(literal("a"), literal("b"));

  assertEquals(aOrB.parse("1"), {
    success: false,
    message: "",
    position: { line: 1, column: 1 },
  });
});
