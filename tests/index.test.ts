import { assertEquals, assertIsError, assertThrows } from "@std/assert";
import { any } from "../combinators/alternation/mod.ts";
import { many } from "../combinators/iteration/many.ts";
import { seq } from "../combinators/sequencing/seq.ts";
import { digit, letter, literal, number, whitespace } from "../common/mod.ts";
import { ParseError, parseErrors } from "../errors.ts";
import { take } from "../primitives/take.ts";
import { takeTwo } from "../primitives/mod.ts";

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

// Explore a search space
const oneOrTwoItems = any(take, takeTwo);
const explore = many(oneOrTwoItems);

Deno.test("explore", () => {
  assertEquals(explore.parse("many"), {
    success: true,
    results: [
      {
        remaining: "",
        value: ["m", "a", "n", "y"],
        position: { line: 1, column: 4 },
      },
      {
        remaining: "",
        value: ["m", "a", "ny"],
        position: { line: 1, column: 4 },
      },
      {
        remaining: "",
        value: ["m", "an", "y"],
        position: { line: 1, column: 4 },
      },
      {
        remaining: "",
        value: ["ma", "n", "y"],
        position: { line: 1, column: 4 },
      },
      { remaining: "", value: ["ma", "ny"], position: { line: 1, column: 4 } },
    ],
  });
});

const thrw = seq(number, literal("then"), number);

Deno.test("parse error", () => {
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
