import { assertEquals } from "@std/assert/equals";
import { parseErrors } from "../errors.ts";
import { decimal, digit, integer, natural } from "./mod.ts";

Deno.test("digit", () => {
  assertEquals(digit.parse("a"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });

  assertEquals(digit.parse("2"), {
    success: true,
    results: [{ value: 2, remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(digit.parse("23"), {
    success: true,
    results: [{ value: 2, remaining: "3", position: { line: 1, column: 1 } }],
  });
});

Deno.test("natural", () => {
  assertEquals(natural.parse("23 and more"), {
    success: true,
    results: [{
      value: 23,
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(natural.parse("and more"), {
    success: false,
    message: parseErrors.natural,
    position: { line: 1, column: 0 },
  });
});

Deno.test("integer", () => {
  assertEquals(integer.parse("23 and more"), {
    success: true,
    results: [{
      value: 23,
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(integer.parse("and more"), {
    success: false,
    message: parseErrors.integer,
    position: { line: 1, column: 0 },
  });

  assertEquals(integer.parse("-23 and more"), {
    success: true,
    results: [{
      value: -23,
      remaining: "and more",
      position: { line: 1, column: 4 },
    }],
  });
});

Deno.test("decimal", () => {
  assertEquals(decimal.parse("2.3 and more"), {
    success: true,
    results: [{
      value: 2.3,
      remaining: "and more",
      position: { line: 1, column: 4 },
    }],
  });

  assertEquals(decimal.parse("23 and more"), {
    success: false,
    message: parseErrors.decimal,
    position: { line: 1, column: 0 },
  });

  assertEquals(decimal.parse("-2.3 and more"), {
    success: true,
    results: [{
      value: -2.3,
      remaining: "and more",
      position: { line: 1, column: 5 },
    }],
  });
});
