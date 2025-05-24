import { assertEquals, assertThrows } from "@std/assert";
import { foldR } from "$combinators";
import { digit, literal } from "$common";
import { parseErrors } from "../../errors.ts";

const caret = literal("^").map(() => (a: number, b: number) => a ** b);

Deno.test("negative arguments", () => {
  assertThrows(
    () => foldR(digit, caret, -3, -2).parse("6^5^4^3^2^1"),
    "foldR: min cannot be less than 1",
  );
});

Deno.test("argument order", () => {
  assertThrows(
    () => foldR(digit, caret, 3, 2).parse("6^5^4^3^2^1"),
    "foldR: max cannot be less than min",
  );
});

Deno.test("zero arguments", () => {
  assertThrows(
    () => foldR(digit, caret, 0, 0).parse("6^5^4^3^2^1"),
    "foldR: min cannot be less than 1",
  );
});

Deno.test("4^3^2^1^a^b", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("4^3^2^1^a^b"), {
    success: true,
    results: [{
      value: 262_144,
      remaining: "^1^a^b",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("3^2^1^a^b^c", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("3^2^1^a^b^c"), {
    success: true,
    results: [{
      value: 9,
      remaining: "^a^b^c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("2^1^a^b^c^d", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("2^1^a^b^c^d"), {
    success: true,
    results: [{
      value: 2,
      remaining: "^a^b^c^d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1^a^b^c^d^e", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("1^a^b^c^d^e"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 2 },
  });
});

Deno.test("1abcde", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("1abcde"), {
    success: false,
    message: "Expected '^', but got 'a'",
    position: { line: 1, column: 1 },
  });
});

Deno.test("abcdef", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("^", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse("^"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(foldR(digit, caret, 2, 3).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
