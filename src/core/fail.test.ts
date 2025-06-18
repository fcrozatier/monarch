import { assertEquals } from "@std/assert";
import { fail } from "$core";
import { anyChar } from "$common";

Deno.test("fail", () => {
  assertEquals(fail.chain(() => anyChar).parse("m"), fail.parse("m"));
  assertEquals(anyChar.chain(() => fail).parse("m"), {
    success: false,
    message: "",
    position: {
      column: 1,
      line: 1,
    },
  });
});
