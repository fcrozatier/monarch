import { assertEquals } from "@std/assert";
import { fail } from "$core";
import { take } from "$common";

Deno.test("zero is an absorbing element of bind", () => {
  assertEquals(fail.bind(() => take).parse("m"), fail.parse("m"));
  // assertEquals(take.bind(() => zero).parse("m"), zero.parse("m"));
});
