import { assertEquals } from "@std/assert";
import {
  digit,
  integer,
  item,
  letter,
  listOfInts,
  literal,
  lower,
  natural,
  twoItems,
  upper,
} from "../examples/basic.ts";
import { any, sequence } from "../parser.ts";

Deno.test("item", () => {
  assertEquals(item.parse(""), []);
  assertEquals(item.parse("monad"), [{
    value: "m",
    remaining: "onad",
  }]);
});

Deno.test("two items", () => {
  assertEquals(twoItems.parse("m"), []);
  assertEquals(twoItems.parse("monad"), [{
    value: "mo",
    remaining: "nad",
  }]);
});

const oneOrTwoItems = any(item, twoItems);

Deno.test("alternation", () => {
  assertEquals(oneOrTwoItems.parse(""), []);
  assertEquals(oneOrTwoItems.parse("m"), [{
    value: "m",
    remaining: "",
  }]);
  assertEquals(oneOrTwoItems.parse("monad"), [{
    value: "m",
    remaining: "onad",
  }, {
    value: "mo",
    remaining: "nad",
  }]);
});

Deno.test("letter", () => {
  assertEquals(letter.parse("m"), [{ value: "m", remaining: "" }]);
  assertEquals(letter.parse("m"), [{ value: "m", remaining: "" }]);
});

const twoLower = sequence(lower, lower).map((letters) => letters.join(""));

Deno.test("lower", () => {
  assertEquals(lower.parse("Hello"), []);
  assertEquals(twoLower.parse("abcd"), [{ value: "ab", remaining: "cd" }]);
  assertEquals(twoLower.parse("aBcd"), []);
});

Deno.test("upper", () => {
  assertEquals(upper.parse("Hello"), [{ value: "H", remaining: "ello" }]);
});

Deno.test("digit", () => {
  assertEquals(digit.parse("a"), []);
  assertEquals(digit.parse("2"), [{ value: 2, remaining: "" }]);
  assertEquals(digit.parse("23"), [{ value: 2, remaining: "3" }]);
});

Deno.test("literal", () => {
  assertEquals(literal("m").parse("a"), [{ error: "Expected m, but got 'a'" }]);
  assertEquals(literal("m").parse("monad"), [{
    value: "m",
    remaining: "onad",
  }]);

  assertEquals(literal("hello").parse("hello there"), [{
    value: "hello",
    remaining: " there",
  }]);
  assertEquals(literal("hello").parse("helicopter"), [{
    error: "Expected hello, but got 'helic'",
  }]);
});

Deno.test("natural", () => {
  assertEquals(natural.parse("23 and more"), [
    { value: 23, remaining: " and more" },
  ]);

  assertEquals(natural.parse("and more"), []);
});

Deno.test("integer", () => {
  assertEquals(integer.parse("23 and more"), [
    { value: 23, remaining: " and more" },
  ]);
  assertEquals(integer.parse("and more"), []);
  assertEquals(integer.parse("-23 and more"), [{
    value: -23,
    remaining: " and more",
  }]);
});

Deno.test("list of integers", () => {
  assertEquals(listOfInts.parse("[1,-2,3] and more"), [
    { value: [1, -2, 3], remaining: " and more" },
  ]);
});
