import { assertEquals, assertIsError, assertThrows } from "@std/assert";
import { literal, number, sequence, take } from "../../lib/main.ts";
import { ParseError } from "../errors.ts";

const thrw = sequence([number, literal("then"), number]);

Deno.test("parse error", () => {
  assertEquals(take.parseOrThrow("monad"), "m");

  assertThrows(() => (thrw.parseOrThrow("1 next 2")));

  try {
    thrw.parseOrThrow("1 next 2");
  } catch (error: unknown) {
    const errorMessage = `at line 1, column 2
	1 next 2
	  ^
Reason: Expected 'then', but got 'next'`;
    assertIsError(error, ParseError);
    if (error instanceof ParseError) {
      assertEquals(error.message, errorMessage);
    }
  }
});
