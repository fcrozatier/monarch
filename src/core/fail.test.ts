import { assertEquals } from "@std/assert";
import { fail } from "$core";
import { take } from "$common";

Deno.test("fail", () => {
  assertEquals(fail.flatMap(() => take).parse("m"), fail.parse("m"));
  assertEquals(take.flatMap(() => fail).parse("m"), {
    success: false,
    message: "",
    position: {
      column: 1,
      line: 1,
    },
  });
});
