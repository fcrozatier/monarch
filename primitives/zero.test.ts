import { assertEquals } from "@std/assert/equals";
import { take } from "../examples/common.ts";
import { zero } from "./zero.ts";

Deno.test("zero is an absorbing element of bind", () => {
  assertEquals(zero.bind(() => take).parse("m"), zero.parse("m"));
  // assertEquals(take.bind(() => zero).parse("m"), zero.parse("m"));
});
