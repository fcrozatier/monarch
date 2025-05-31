import { assertEquals } from "@std/assert";
import { repeat1 } from "$combinators";
import { digit } from "$common";
import { parseErrors } from "../../errors.ts";

Deno.test("123abc", () => {
  assertEquals(repeat1(digit).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(repeat1(digit).parse("12abcd"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: "abcd",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(repeat1(digit).parse("1abcde"), {
    success: true,
    results: [{
      value: [1],
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(repeat1(digit).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(repeat1(digit).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
