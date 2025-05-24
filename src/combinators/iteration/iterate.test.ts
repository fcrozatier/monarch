import { assertEquals } from "@std/assert";
import { iterate } from "$combinators";
import { digit, letter } from "$common";

Deno.test("iterate", () => {
  assertEquals(iterate(digit).parse("23 and more"), {
    success: true,
    results: [
      {
        value: [2, 3],
        remaining: " and more",
        position: { line: 1, column: 2 },
      },
      { value: [2], remaining: "3 and more", position: { line: 1, column: 1 } },
      { value: [], remaining: "23 and more", position: { line: 1, column: 0 } },
    ],
  });

  assertEquals(iterate(letter).parse("Yes!"), {
    success: true,
    results: [
      {
        value: ["Y", "e", "s"],
        remaining: "!",
        position: { line: 1, column: 3 },
      },
      { value: ["Y", "e"], remaining: "s!", position: { line: 1, column: 2 } },
      { value: ["Y"], remaining: "es!", position: { line: 1, column: 1 } },
      { value: [], remaining: "Yes!", position: { line: 1, column: 0 } },
    ],
  });
});
