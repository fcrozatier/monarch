import { assertEquals } from "@std/assert";
import { upper } from "../main.ts";

Deno.test("upper", () => {
  assertEquals(upper.parse("Hello"), {
    success: true,
    results: [{
      value: "H",
      remaining: "ello",
      position: { line: 1, column: 1 },
    }],
  });
});
