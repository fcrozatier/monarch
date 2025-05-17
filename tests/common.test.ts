import { assertEquals } from "@std/assert";
import { repeat } from "../combinators/iteration/mod.ts";
import { lower } from "../common/mod.ts";
import { take } from "../primitives/mod.ts";

export const twoLower = repeat(lower, 2).map((letters) => letters.join(""))
  .error(
    "Expected two lowercase letters",
  );

const even = take.filter((r) => /^[02468]/.test(r)).error(
  "Expected an even number",
);

Deno.test("filter", () => {
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
