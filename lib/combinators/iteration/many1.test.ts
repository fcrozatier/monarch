import { assertEquals } from "@std/assert";
import { digit, many1 } from "../../main.ts";

Deno.test("many1", () => {
  // Matches 1 or more times
  assertEquals(many1(digit).error("Expected many digits").parse("a"), {
    success: false,
    message: "Expected many digits",
    position: { line: 1, column: 0 },
  });
});
