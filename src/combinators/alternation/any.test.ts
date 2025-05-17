import { many, repeat } from "$combinators";
import { literal, take } from "$common";
import type { Parser } from "$core";
import { assertEquals } from "@std/assert";
import { any } from "./any.ts";
import { parseErrors } from "../../errors.ts";

/**
 * Parses the next two characters
 */
export const takeTwo: Parser<string> = repeat(take, 2).map((arr) =>
  arr.join("")
).error(parseErrors.takeTwoError);

const oneOrTwoChars = any(take, takeTwo);

Deno.test("take two", () => {
  assertEquals(takeTwo.parse("m"), {
    success: false,
    message: parseErrors.takeTwoError,
    position: { line: 1, column: 0 },
  });

  assertEquals(takeTwo.parse("monad"), {
    success: true,
    results: [{
      value: "mo",
      remaining: "nad",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("any", () => {
  assertEquals(oneOrTwoChars.parse(""), {
    success: false,
    position: { line: 1, column: 0 },
    message: parseErrors.takeError,
  });

  assertEquals(oneOrTwoChars.parse("m"), {
    success: true,
    results: [{ value: "m", remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(oneOrTwoChars.parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }, {
      value: "mo",
      remaining: "nad",
      position: { line: 1, column: 2 },
    }],
  });

  const aOrB = any(literal("a"), literal("b"));

  assertEquals(aOrB.parse("1"), {
    success: false,
    message: "Expected 'a', but got '1'",
    position: { line: 1, column: 0 },
  });
});

// Explore a search space
const explore = many(oneOrTwoChars);

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
