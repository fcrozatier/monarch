import { alt, seq } from "$combinators";
import {
  digit,
  letter,
  literal,
  number,
  take,
  token,
  whitespace,
} from "$common";
import { assertEquals, assertIsError, assertThrows } from "@std/assert";
import { ParseError, parseErrors } from "../errors.ts";

Deno.test("fallback", () => {
  assertEquals(digit.fallback(42).parse("123"), {
    success: true,
    results: [{
      value: 1,
      remaining: "23",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(digit.fallback(42).parse("abc"), {
    success: true,
    results: [{
      value: 42,
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });

  assertEquals(digit.fallback(42).parse(""), {
    success: true,
    results: [{
      value: 42,
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });

  const visibility = alt(token("public"), token("private")).fallback("public");

  assertEquals(visibility.parse("myIdentifier"), {
    success: true,
    results: [{
      value: "public",
      remaining: "myIdentifier",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("filter", () => {
  const even = take.filter((r) => /^[02468]/.test(r)).error(
    "Expected an even number",
  );

  assertEquals(even.parse("2"), {
    success: true,
    results: [{
      value: "2",
      remaining: "",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(even.parse("1"), {
    success: false,
    message: "Expected an even number",
    position: { line: 1, column: 0 },
  });
});

Deno.test("skipTrailing", () => {
  assertEquals(digit.skipTrailing(letter).parse("1a"), {
    success: true,
    results: [{
      value: 1,
      remaining: "",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(digit.skipTrailing(letter).parse("12"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 1 },
  });

  assertEquals(digit.skipTrailing(letter).parse("ab"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });

  assertEquals(digit.skipTrailing(letter, whitespace).parse("1a "), {
    success: true,
    results: [{
      value: 1,
      remaining: "",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(digit.skipTrailing(letter, whitespace).parse("1a"), {
    success: false,
    message: parseErrors.whitespace,
    position: { line: 1, column: 2 },
  });
});

Deno.test("skipLeading", () => {
  assertEquals(letter.skipLeading(digit).parse("1a"), {
    success: true,
    results: [{
      value: "a",
      remaining: "",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(letter.skipLeading(digit).parse("12"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 1 },
  });

  assertEquals(letter.skipLeading(digit).parse("ab"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });

  assertEquals(letter.skipLeading(digit, whitespace).parse("1 a"), {
    success: true,
    results: [{
      value: "a",
      remaining: "",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(letter.skipLeading(digit, whitespace).parse("1a"), {
    success: false,
    message: parseErrors.whitespace,
    position: { line: 1, column: 1 },
  });
});

Deno.test("parseOrThrow", () => {
  const thrw = seq(number, literal("then"), number);

  assertEquals(take.parseOrThrow("monad"), "m");

  assertThrows(() => (thrw.parseOrThrow("1 next 2")));

  try {
    thrw.parseOrThrow("1 next 2");
  } catch (error: unknown) {
    const errorMessage = `at line 1, column 2
	1 next 2
	  ^
Reason: Expected 'then', but got 'next'`;
    assertIsError(error, ParseError);
    if (error instanceof ParseError) {
      assertEquals(error.message, errorMessage);
    }
  }
});
