import { assertEquals } from "@std/assert/equals";
import { expr } from "../examples/arithmetic-expressions.ts";

Deno.test("arithmetic expressions", () => {
  assertEquals(expr.parse("-1"), {
    success: true,
    results: [{
      value: -1,
      remaining: "",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(expr.parse("+1.5"), {
    success: true,
    results: [{
      value: 1.5,
      remaining: "",
      position: { line: 1, column: 4 },
    }],
  });

  assertEquals(expr.parse("1/2"), {
    success: true,
    results: [{
      value: 0.5,
      remaining: "",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(expr.parse("1--2"), {
    success: true,
    results: [{
      value: 3,
      remaining: "",
      position: { line: 1, column: 4 },
    }],
  });

  assertEquals(expr.parse("1+2+3"), {
    success: true,
    results: [{
      value: 6,
      remaining: "",
      position: { line: 1, column: 5 },
    }],
  });

  assertEquals(expr.parse("1*2*3"), {
    success: true,
    results: [{
      value: 6,
      remaining: "",
      position: { line: 1, column: 5 },
    }],
  });

  assertEquals(expr.parse("2^2^3"), {
    success: true,
    results: [{
      value: 2 ** 8,
      remaining: "",
      position: { line: 1, column: 5 },
    }],
  });

  assertEquals(expr.parse("1+2*3"), {
    success: true,
    results: [{
      value: 7,
      remaining: "",
      position: { line: 1, column: 5 },
    }],
  });

  assertEquals(expr.parse("(1+2)*3"), {
    success: true,
    results: [{
      value: 9,
      remaining: "",
      position: { line: 1, column: 7 },
    }],
  });

  assertEquals(expr.parse("1+2^3+2/2"), {
    success: true,
    results: [{
      value: 10,
      remaining: "",
      position: { line: 1, column: 9 },
    }],
  });

  assertEquals(expr.parse("(1+2)^3/3+1"), {
    success: true,
    results: [{
      value: 10,
      remaining: "",
      position: { line: 1, column: 11 },
    }],
  });
});
