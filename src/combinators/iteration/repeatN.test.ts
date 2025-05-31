import { assertEquals, assertThrows } from "@std/assert";
import { repeatN } from "$combinators";
import { digit } from "$common";
import { parseErrors } from "../../errors.ts";

Deno.test("negative argument", () => {
  assertThrows(
    () => repeatN(digit, -1).parse("123456"),
    "repeatN: times cannot be negative",
  );
});

Deno.test("zero argument", () => {
  assertEquals(repeatN(digit, 0).parse("123456"), {
    success: true,
    results: [{
      value: [],
      remaining: "123456",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("1234ab", () => {
  assertEquals(repeatN(digit, 3).parse("1234ab"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "4ab",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("123abc", () => {
  assertEquals(repeatN(digit, 3).parse("123abc"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: "abc",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("12abcd", () => {
  assertEquals(repeatN(digit, 3).parse("12abcd"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 2 },
  });
});

Deno.test("abcdef", () => {
  assertEquals(repeatN(digit, 3).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(repeatN(digit, 3).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
