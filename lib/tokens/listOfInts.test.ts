import { assertEquals } from "@std/assert";
import { listOfInts } from "../main.ts";

Deno.test("list of integers", () => {
  assertEquals(listOfInts.parse("[1 ,  -2, 3] and more"), {
    success: true,
    results: [{
      value: [1, -2, 3],
      remaining: "and more",
      position: { line: 1, column: 13 },
    }],
  });

  assertEquals(listOfInts.parse("[] and more"), {
    success: true,
    results: [{
      value: [],
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(listOfInts.parse("1 ,  -2, 3] and more"), {
    success: false,
    message: "Expected '[', but got '1'",
    position: { line: 1, column: 0 },
  });

  assertEquals(listOfInts.parse("[a ,  -2, 3] and more"), {
    success: false,
    message: "Expected ']', but got 'a'",
    position: { line: 1, column: 1 },
  });

  assertEquals(listOfInts.parse("[1  -2, 3] and more"), {
    success: false,
    message: "Expected ']', but got '-'",
    position: { line: 1, column: 4 },
  });
});
