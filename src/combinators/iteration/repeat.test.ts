import { assertEquals } from "@std/assert";
import { lower } from "../../common/characters.ts";
import { repeat } from "./repeat.ts";

const twoLower = repeat(lower, 2).map((letters) => letters.join(""))
  .error("Expected two lowercase letters");

Deno.test("repeat", () => {
  assertEquals(twoLower.parse("abcd"), {
    success: true,
    results: [{
      value: "ab",
      remaining: "cd",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(twoLower.parse("aBcd"), {
    success: false,
    message: "Expected two lowercase letters",
    position: { line: 1, column: 0 },
  });
});
