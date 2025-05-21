import { many, repeat } from "$combinators";
import { anyChar, literal } from "$common";
import { assertEquals } from "@std/assert";
import { parseErrors } from "../../errors.ts";
import { explore } from "./explore.ts";

const takeTwoError = "Expected two characters";
const takeTwo = repeat(anyChar, 2).map((arr) => arr.join("")).error(
  takeTwoError,
);
const oneOrTwoChars = explore(anyChar, takeTwo);

Deno.test("take two", () => {
  assertEquals(takeTwo.parse("m"), {
    success: false,
    message: takeTwoError,
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

Deno.test("explore", () => {
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

  const aOrB = explore(literal("a"), literal("b"));

  assertEquals(aOrB.parse("1"), {
    success: false,
    message: "Expected 'a', but got '1'",
    position: { line: 1, column: 0 },
  });
});

Deno.test("search space", () => {
  const search = many(oneOrTwoChars);
  assertEquals(search.parse("many"), {
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
