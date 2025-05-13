import { assertEquals } from "@std/assert";
import { digit, foldL1, literal } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

const plus = literal("+").map(() => (a: number, b: number) => a + b);

Deno.test("1+2+3+a+b+c", () => {
  assertEquals(foldL1(digit, plus).parse("1+2+3+a+b+c"), {
    success: true,
    results: [{
      value: 6,
      remaining: "+a+b+c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1+2+a+b+c+d", () => {
  assertEquals(foldL1(digit, plus).parse("1+2+a+b+c+d"), {
    success: true,
    results: [{
      value: 3,
      remaining: "+a+b+c+d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1+a+b+c+d+e", () => {
  assertEquals(foldL1(digit, plus).parse("1+a+b+c+d+e"), {
    success: true,
    results: [{
      value: 1,
      remaining: "+a+b+c+d+e",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(foldL1(digit, plus).parse("1abcde"), {
    success: true,
    results: [{
      value: 1,
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(foldL1(digit, plus).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("+", () => {
  assertEquals(foldL1(digit, plus).parse("+"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(foldL1(digit, plus).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
