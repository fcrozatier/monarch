import { assertEquals } from "@std/assert";
import { repeat0 } from "$combinators";
import { digit } from "$common";

Deno.test("123abc", () => {
  assertEquals(repeat0(digit).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(repeat0(digit).parse("12abcd"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: "abcd",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(repeat0(digit).parse("1abcde"), {
    success: true,
    results: [{
      value: [1],
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(repeat0(digit).parse("abcdef"), {
    success: true,
    results: [{
      value: [],
      remaining: "abcdef",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("empty string", () => {
  assertEquals(repeat0(digit).parse(""), {
    success: true,
    results: [{
      value: [],
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
