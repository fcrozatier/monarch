import { assertEquals } from "@std/assert";
import { defaulted, digit } from "../../main.ts";

Deno.test("defaulted", () => {
  assertEquals(defaulted(digit, 42).parse("123"), {
    success: true,
    results: [{
      value: 1,
      remaining: "23",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(defaulted(digit, 42).parse("abc"), {
    success: true,
    results: [{
      value: 42,
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });

  assertEquals(defaulted(digit, 42).parse(""), {
    success: true,
    results: [{
      value: 42,
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
