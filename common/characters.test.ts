import { assertEquals } from "@std/assert";
import { parseErrors } from "../errors.ts";
import { twoLower } from "../tests/common.test.ts";
import { letter, lower, upper } from "./mod.ts";

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

  assertEquals(twoLower.parse("abcd"), {
    success: true,
    results: [{
      value: "ab",
      remaining: "cd",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(twoLower.parse("aBcd"), {
    success: false,
    message: "Expected two lowercase letters",
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
