import { assertEquals } from "@std/assert";
import { digit, foldL, literal } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

const plus = literal("+").map(() => (a: number, b: number) => a + b);

Deno.test("negative arguments", () => {
  assertEquals(foldL(digit, plus, -3, -2).parse("1+2+3+4+5+6"), {
    success: false,
    message: "foldL: min cannot be less than 1",
    position: { line: 1, column: 0 },
  });
});

Deno.test("argument order", () => {
  assertEquals(foldL(digit, plus, 3, 2).parse("1+2+3+4+5+6"), {
    success: false,
    message: "foldL: max cannot be less than min",
    position: { line: 1, column: 0 },
  });
});

Deno.test("zero arguments", () => {
  assertEquals(foldL(digit, plus, 0, 0).parse("1+2+3+4+5+6"), {
    success: false,
    message: "foldL: min cannot be less than 1",
    position: { line: 1, column: 0 },
  });
});

Deno.test("1+2+3+4+a+b", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("1+2+3+4+a+b"), {
    success: true,
    results: [{
      value: 6,
      remaining: "+4+a+b",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1+2+3+a+b+c", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("1+2+3+a+b+c"), {
    success: true,
    results: [{
      value: 6,
      remaining: "+a+b+c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1+2+a+b+c+d", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("1+2+a+b+c+d"), {
    success: true,
    results: [{
      value: 3,
      remaining: "+a+b+c+d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1+a+b+c+d+e", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("1+a+b+c+d+e"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 2 },
  });
});

Deno.test("1abcde", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("1abcde"), {
    success: false,
    message: "Expected '+', but got 'a'",
    position: { line: 1, column: 1 },
  });
});

Deno.test("abcdef", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("+", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse("+"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(foldL(digit, plus, 2, 3).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
