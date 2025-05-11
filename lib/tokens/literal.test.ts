import { assertEquals } from "@std/assert";
import { literal } from "../main.ts";

Deno.test("literal", () => {
  assertEquals(literal("m").parse("a"), {
    success: false,
    message: "Expected 'm', but got 'a'",
    position: { line: 1, column: 0 },
  });

  assertEquals(literal("m").parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(literal("hello").parse("hello there"), {
    success: true,
    results: [{
      value: "hello",
      remaining: " there",
      position: { line: 1, column: 5 },
    }],
  });

  assertEquals(literal("hello").parse("helicopter"), {
    success: false,
    message: "Expected 'hello', but got 'helic'",
    position: { line: 1, column: 0 },
  });
});
