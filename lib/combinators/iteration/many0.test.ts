import { assertEquals } from "@std/assert";
import { digit, many0 } from "../../main.ts";

Deno.test("123abc", () => {
  assertEquals(many0(digit).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(many0(digit).parse("12abcd"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: "abcd",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(many0(digit).parse("1abcde"), {
    success: true,
    results: [{
      value: [1],
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(many0(digit).parse("abcdef"), {
    success: true,
    results: [{
      value: [],
      remaining: "abcdef",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("empty string", () => {
  assertEquals(many0(digit).parse(""), {
    success: true,
    results: [{
      value: [],
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
