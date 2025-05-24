import { assertEquals } from "@std/assert";
import { sepBy0 } from "$combinators";
import { digit, literal } from "$common";

Deno.test("1,2,3,a,b,c", () => {
  assertEquals(sepBy0(digit, literal(",")).parse("1,2,3,a,b,c"), {
    success: true,
    results: [{
      value: [1, 2, 3],
      remaining: ",a,b,c",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("1,2,a,b,c,d", () => {
  assertEquals(sepBy0(digit, literal(",")).parse("1,2,a,b,c,d"), {
    success: true,
    results: [{
      value: [1, 2],
      remaining: ",a,b,c,d",
      position: { line: 1, column: 3 },
    }],
  });
});

Deno.test("1,a,b,c,d,e", () => {
  assertEquals(sepBy0(digit, literal(",")).parse("1,a,b,c,d,e"), {
    success: true,
    results: [{
      value: [1],
      remaining: ",a,b,c,d,e",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("1abcde", () => {
  assertEquals(sepBy0(digit, literal(",")).parse("1abcde"), {
    success: true,
    results: [{
      value: [1],
      remaining: "abcde",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("abcdef", () => {
  assertEquals(sepBy0(digit, literal(",")).parse("abcdef"), {
    success: true,
    results: [{
      value: [],
      remaining: "abcdef",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test(",", () => {
  assertEquals(sepBy0(digit, literal(",")).parse(","), {
    success: true,
    results: [{
      value: [],
      remaining: ",",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("empty string", () => {
  assertEquals(sepBy0(digit, literal(",")).parse(""), {
    success: true,
    results: [{
      value: [],
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});
