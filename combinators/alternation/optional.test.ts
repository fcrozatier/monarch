import { assertEquals } from "@std/assert";
import { digit } from "../../common/mod.ts";
import { optional } from "./optional.ts";

Deno.test("optional", () => {
  assertEquals(optional(digit).parse("123"), {
    success: true,
    results: [{
      value: 1,
      remaining: "23",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(optional(digit).parse("abc"), {
    success: true,
    results: [{
      value: undefined,
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });

  assertEquals(optional(digit).parse(""), {
    success: true,
    results: [{
      value: undefined,
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
