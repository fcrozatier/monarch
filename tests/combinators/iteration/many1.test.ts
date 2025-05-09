import { assertEquals } from "@std/assert";
import { digit } from "monarch/common";
import { many1 } from "monarch";

Deno.test("123abc", () => {
  assertEquals(many1(digit).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(many1(digit).parse("12abcd"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: "abcd",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(many1(digit).parse("1abcde"), {
    success: true,
    results: [{
      value: [1],
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(many1(digit).parse("abcdef"), {
    success: false,
    message: "Expected a digit",
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(many1(digit).parse(""), {
    success: false,
    message: "Expected a digit",
    position: { line: 1, column: 0 },
  });
});
