import { assertEquals } from "@std/assert";
import { digit, literal, result, sequence } from "../../main.ts";

Deno.test("sequence", () => {
  assertEquals(
    sequence([literal("a"), digit]).bind(([str, num]) =>
      result(str.toUpperCase() + `${num * 100}`)
    ).parse("a3"),
    {
      success: true,
      results: [{
        value: "A300",
        remaining: "",
        position: { line: 1, column: 2 },
      }],
    },
  );
});
