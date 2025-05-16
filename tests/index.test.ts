import { assertEquals, assertIsError, assertThrows } from "@std/assert";
import { ParseError, parseErrors } from "../errors.ts";
import {
  digit,
  letter,
  literal,
  number,
  take,
  takeTwo,
  whitespace,
} from "../examples/common.ts";
import { any, iterate, many, many1, result, seq, zero } from "../index.ts";

Deno.test("zero is an absorbing element of bind", () => {
  assertEquals(zero.bind(() => take).parse("m"), zero.parse("m"));
  // assertEquals(take.bind(() => zero).parse("m"), zero.parse("m"));
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

Deno.test("iterate", () => {
  assertEquals(iterate(digit).parse("23 and more"), {
    success: true,
    results: [
      {
        value: [2, 3],
        remaining: " and more",
        position: { line: 1, column: 2 },
      },
      { value: [2], remaining: "3 and more", position: { line: 1, column: 1 } },
      { value: [], remaining: "23 and more", position: { line: 1, column: 0 } },
    ],
  });

  assertEquals(iterate(letter).parse("Yes!"), {
    success: true,
    results: [
      {
        value: ["Y", "e", "s"],
        remaining: "!",
        position: { line: 1, column: 3 },
      },
      { value: ["Y", "e"], remaining: "s!", position: { line: 1, column: 2 } },
      { value: ["Y"], remaining: "es!", position: { line: 1, column: 1 } },
      { value: [], remaining: "Yes!", position: { line: 1, column: 0 } },
    ],
  });
});

Deno.test("many", () => {
  assertEquals(many(digit).parse("23 and more"), {
    success: true,
    results: [{
      value: [2, 3],
      remaining: " and more",
      position: { line: 1, column: 2 },
    }],
  });

  // Matches 0 or more times
  assertEquals(many(digit).parse("a"), {
    success: true,
    results: [{
      value: [],
      remaining: "a",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("many1", () => {
  // Matches 1 or more times
  assertEquals(many1(digit).error("Expected many digits").parse("a"), {
    success: false,
    message: "Expected many digits",
    position: { line: 1, column: 0 },
  });
});

Deno.test("sequence", () => {
  assertEquals(
    seq(literal("a"), digit).bind(([str, num]) =>
      result(str.toUpperCase() + `${num * 100}`)
    ).parse("a3"),
    {
      success: true,
      results: [{
        value: "A300",
        remaining: "",
        position: { line: 1, column: 2 },
      }],
    },
  );
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
