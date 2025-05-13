import { assertEquals } from "@std/assert";
import { any, many0, take, takeTwo } from "../main.ts";
import { parseErrors } from "../../src/errors.ts";

Deno.test("two items", () => {
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

// Explore a search space
const oneOrTwoItems = any(take, takeTwo);
const explore = many0(oneOrTwoItems);

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
