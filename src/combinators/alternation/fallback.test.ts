import { assertEquals } from "@std/assert";
import { digit } from "../../common/mod.ts";
import { fallback } from "./fallback.ts";

Deno.test("fallback", () => {
  assertEquals(fallback(digit, 42).parse("123"), {
    success: true,
    results: [{
      value: 1,
      remaining: "23",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(fallback(digit, 42).parse("abc"), {
    success: true,
    results: [{
      value: 42,
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });

  assertEquals(fallback(digit, 42).parse(""), {
    success: true,
    results: [{
      value: 42,
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
