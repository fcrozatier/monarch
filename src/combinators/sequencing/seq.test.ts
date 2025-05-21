import { assertEquals } from "@std/assert/equals";
import { digit, literal } from "../../common/mod.ts";
import { result } from "$core";
import { seq } from "./seq.ts";

Deno.test("sequence", () => {
  assertEquals(
    seq(literal("a"), digit).flatMap(([str, num]) =>
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
