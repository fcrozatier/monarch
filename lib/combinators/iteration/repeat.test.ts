import { assertEquals } from "@std/assert";
import { digit, repeat } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

Deno.test("negative argument", () => {
  assertEquals(repeat(digit, -1).parse("123456"), {
    success: false,
    message: "repeat: times cannot be negative",
    position: { line: 1, column: 0 },
  });
});

Deno.test("zero argument", () => {
  assertEquals(repeat(digit, 0).parse("123456"), {
    success: true,
    results: [{
      value: [],
      remaining: "123456",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("1234ab", () => {
  assertEquals(repeat(digit, 3).parse("1234ab"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "4ab",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("123abc", () => {
  assertEquals(repeat(digit, 3).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(repeat(digit, 3).parse("12abcd"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 2 },
  });
});

Deno.test("abcdef", () => {
  assertEquals(repeat(digit, 3).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(repeat(digit, 3).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
