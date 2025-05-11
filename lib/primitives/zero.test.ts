import { assertEquals } from "@std/assert";
import { take, zero } from "../main.ts";

Deno.test("zero is an absorbing element of bind", () => {
  assertEquals(zero.bind(() => take).parse("m"), zero.parse("m"));
  // assertEquals(take.bind(() => zero).parse("m"), zero.parse("m"));
});
