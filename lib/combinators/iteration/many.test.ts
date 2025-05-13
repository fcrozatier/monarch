import { assertEquals } from "@std/assert";
import { digit, many } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

Deno.test("negative arguments", () => {
  assertEquals(many(digit, -3, -2).parse("abcdef"), {
    success: false,
    message: "many: min cannot be negative",
    position: { line: 1, column: 0 },
  });
});

Deno.test("argument order", () => {
  assertEquals(many(digit, 3, 2).parse("abcdef"), {
    success: false,
    message: "many: max cannot be less than min",
    position: { line: 1, column: 0 },
  });
});

Deno.test("zero arguments", () => {
  assertEquals(many(digit, 0, 0).parse("abcdef"), {
    success: true,
    results: [{
      value: [],
      remaining: "abcdef",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("1234ab", () => {
  assertEquals(many(digit, 2, 3).parse("1234ab"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "4ab",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("123abc", () => {
  assertEquals(many(digit, 2, 3).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(many(digit, 2, 3).parse("12abcd"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: "abcd",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(many(digit, 2, 3).parse("1abcde"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 1 },
  });
});

Deno.test("abcdef", () => {
  assertEquals(many(digit, 2, 3).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(many(digit, 2, 3).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
