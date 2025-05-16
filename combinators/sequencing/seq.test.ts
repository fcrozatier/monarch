import { assertEquals } from "@std/assert/equals";
import { digit, literal } from "../../examples/common.ts";
import { result } from "../../index.ts";
import { seq } from "./seq.ts";

Deno.test("sequence", () => {
  assertEquals(
    seq(literal("a"), digit).bind(([str, num]) =>
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
