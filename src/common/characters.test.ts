import { letter, lower, take, upper } from "$common";
import { parseErrors } from "$core";
import { assertEquals } from "@std/assert";

Deno.test("take", () => {
  assertEquals(take.parse(""), {
    success: false,
    message: parseErrors.takeError,
    position: { line: 1, column: 0 },
  });

  assertEquals(take.parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("letter", () => {
  assertEquals(letter.parse("m"), {
    success: true,
    results: [{ value: "m", remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(letter.parse("1"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 0 },
  });
});

Deno.test("lower", () => {
  assertEquals(lower.parse("Hello"), {
    success: false,
    message: parseErrors.lower,
    position: { line: 1, column: 0 },
  });
});

Deno.test("upper", () => {
  assertEquals(upper.parse("Hello"), {
    success: true,
    results: [{
      value: "H",
      remaining: "ello",
      position: { line: 1, column: 1 },
    }],
  });
});
