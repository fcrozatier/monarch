import { assertEquals } from "@std/assert";
import { fail } from "$core";
import { anyChar } from "$common";

Deno.test("fail", () => {
  assertEquals(fail.flatMap(() => anyChar).parse("m"), fail.parse("m"));
  assertEquals(anyChar.flatMap(() => fail).parse("m"), {
    success: false,
    message: "",
    position: {
      column: 1,
      line: 1,
    },
  });
});
