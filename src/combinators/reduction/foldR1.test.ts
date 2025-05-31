import { assertEquals } from "@std/assert";
import { foldR1 } from "$combinators";
import { digit, literal } from "$common";
import { parseErrors } from "../../errors.ts";

const caret = literal("^").map(() => (a: number, b: number) => a ** b);

Deno.test("3^2^1^a^b^c", () => {
  assertEquals(foldR1(digit, caret).parse("3^2^1^a^b^c"), {
    success: true,
    results: [{
      value: 9,
      remaining: "^a^b^c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("2^1^a^b^c^d", () => {
  assertEquals(foldR1(digit, caret).parse("2^1^a^b^c^d"), {
    success: true,
    results: [{
      value: 2,
      remaining: "^a^b^c^d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1^a^b^c^d^e", () => {
  assertEquals(foldR1(digit, caret).parse("1^a^b^c^d^e"), {
    success: true,
    results: [{
      value: 1,
      remaining: "^a^b^c^d^e",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(foldR1(digit, caret).parse("1abcde"), {
    success: true,
    results: [{
      value: 1,
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(foldR1(digit, caret).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("^", () => {
  assertEquals(foldR1(digit, caret).parse("^"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(foldR1(digit, caret).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
