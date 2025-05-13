import { assertEquals } from "@std/assert";
import { digit, literal, sepBy1 } from "../../main.ts";
import { parseErrors } from "../../../src/errors.ts";

Deno.test("1,2,3,a,b,c", () => {
  assertEquals(sepBy1(digit, literal(",")).parse("1,2,3,a,b,c"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: ",a,b,c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1,2,a,b,c,d", () => {
  assertEquals(sepBy1(digit, literal(",")).parse("1,2,a,b,c,d"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: ",a,b,c,d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1,a,b,c,d,e", () => {
  assertEquals(sepBy1(digit, literal(",")).parse("1,a,b,c,d,e"), {
    success: true,
    results: [{
      value: [1],
      remaining: ",a,b,c,d,e",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(sepBy1(digit, literal(",")).parse("1abcde"), {
    success: true,
    results: [{
      value: [1],
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(sepBy1(digit, literal(",")).parse("abcdef"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test(",", () => {
  assertEquals(sepBy1(digit, literal(",")).parse(","), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});

Deno.test("empty string", () => {
  assertEquals(sepBy1(digit, literal(",")).parse(""), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });
});
