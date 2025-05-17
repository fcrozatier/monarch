import { assertEquals } from "@std/assert";
import { zero } from "$core";
import { take } from "$common";

Deno.test("zero is an absorbing element of bind", () => {
  assertEquals(zero.bind(() => take).parse("m"), zero.parse("m"));
  // assertEquals(take.bind(() => zero).parse("m"), zero.parse("m"));
});
