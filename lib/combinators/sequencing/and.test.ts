import { assertEquals } from "@std/assert";
import { and, digit, letter } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

Deno.test("1a2b", () => {
  assertEquals(and(digit, letter, digit).parse("1a2b"), {
    success: true,
    results: [{
      value: [1, "a", 2],
      remaining: "b",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1a2", () => {
  assertEquals(and(digit, letter, digit).parse("1a2"), {
    success: true,
    results: [{
      value: [1, "a", 2],
      remaining: "",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1a", () => {
  assertEquals(and(digit, letter, digit).parse("1a"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 2 },
  });
});

Deno.test("1", () => {
  assertEquals(and(digit, letter, digit).parse("1"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 1 },
  });
});

Deno.test("empty string", () => {
  assertEquals(and(digit, letter, digit).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("1a", () => {
  assertEquals(and(digit).parse("1a"), {
    success: true,
    results: [{
      value: [1],
      remaining: "a",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("1", () => {
  assertEquals(and(digit).parse("1"), {
    success: true,
    results: [{
      value: [1],
      remaining: "",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("empty string", () => {
  assertEquals(and(digit).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("abc", () => {
  assertEquals(and().parse("abc"), {
    success: true,
    results: [{
      value: [],
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("empty string", () => {
  assertEquals(and().parse(""), {
    success: true,
    results: [{
      value: [],
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
