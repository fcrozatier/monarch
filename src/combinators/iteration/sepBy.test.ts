import { assertEquals, assertThrows } from "@std/assert";
import { sepBy } from "$combinators";
import { digit, literal } from "$common";
import { parseErrors } from "../../errors.ts";

Deno.test("negative arguments", () => {
  assertThrows(
    () => sepBy(digit, literal(","), -3, -2).parse("1,2,3,4,5,6"),
    "sepBy: min cannot be negative",
  );
});

Deno.test("argument order", () => {
  assertThrows(
    () => sepBy(digit, literal(","), 3, 2).parse("1,2,3,4,5,6"),
    "sepBy: max cannot be less than min",
  );
});

Deno.test("zero arguments", () => {
  assertEquals(sepBy(digit, literal(","), 0, 0).parse("1,2,3,4,5,6"), {
    success: true,
    results: [{
      value: [],
      remaining: "1,2,3,4,5,6",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("1,2,3,4,a,b", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse("1,2,3,4,a,b"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: ",4,a,b",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1,2,3,a,b,c", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse("1,2,3,a,b,c"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: ",a,b,c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1,2,a,b,c,d", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse("1,2,a,b,c,d"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: ",a,b,c,d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1,a,b,c,d,e", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse("1,a,b,c,d,e"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 2 },
  });
});

Deno.test("1abcde", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse("1abcde"), {
    success: false,
    message: "Expected ',', but got 'a'",
    position: { line: 1, column: 1 },
  });
});

Deno.test("abcdef", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test(",", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse(","), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(sepBy(digit, literal(","), 2, 3).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
