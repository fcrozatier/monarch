import { assertEquals } from "@std/assert";
import { filter, regexPredicate, take } from "../main.ts";

const even = filter(take, regexPredicate(/^[02468]/)).error(
  "Expected an even number",
);

Deno.test("filter even", () => {
  assertEquals(even.parse("2"), {
    success: true,
    results: [{
      value: "2",
      remaining: "",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(even.parse("1"), {
    success: false,
    message: "Expected an even number",
    position: { line: 1, column: 0 },
  });
});
