import { assertEquals } from "@std/assert";
import {
  decimal,
  defaulted,
  digit,
  integer,
  letter,
  listOfInts,
  literal,
  lower,
  natural,
  optional,
  regexPredicate,
  take,
  takeTwo,
  upper,
} from "../examples/common.ts";
import { any, filter, repeat } from "../index.ts";
import { parseErrors } from "../errors.ts";

Deno.test("item", () => {
  assertEquals(take.parse(""), {
    success: false,
    message: parseErrors.takeError,
    position: { line: 1, column: 0 },
  });

  assertEquals(take.parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }],
  });
});

Deno.test("two items", () => {
  assertEquals(takeTwo.parse("m"), {
    success: false,
    message: parseErrors.takeTwoError,
    position: { line: 1, column: 0 },
  });

  assertEquals(takeTwo.parse("monad"), {
    success: true,
    results: [{
      value: "mo",
      remaining: "nad",
      position: { line: 1, column: 2 },
    }],
  });
});

const oneOrTwoItems = any(take, takeTwo);

Deno.test("alternation", () => {
  assertEquals(oneOrTwoItems.parse(""), {
    success: false,
    position: { line: 1, column: 0 },
    message: parseErrors.takeError,
  });

  assertEquals(oneOrTwoItems.parse("m"), {
    success: true,
    results: [{ value: "m", remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(oneOrTwoItems.parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }, {
      value: "mo",
      remaining: "nad",
      position: { line: 1, column: 2 },
    }],
  });
});

Deno.test("defaulted", () => {
  assertEquals(defaulted(digit, 42).parse("123"), {
    success: true,
    results: [{
      value: 1,
      remaining: "23",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(defaulted(digit, 42).parse("abc"), {
    success: true,
    results: [{
      value: 42,
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });

  assertEquals(defaulted(digit, 42).parse(""), {
    success: true,
    results: [{
      value: 42,
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("optional", () => {
  assertEquals(optional(digit).parse("123"), {
    success: true,
    results: [{
      value: 1,
      remaining: "23",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(optional(digit).parse("abc"), {
    success: true,
    results: [{
      value: undefined,
      remaining: "abc",
      position: { line: 1, column: 0 },
    }],
  });

  assertEquals(optional(digit).parse(""), {
    success: true,
    results: [{
      value: undefined,
      remaining: "",
      position: { line: 1, column: 0 },
    }],
  });
});

Deno.test("letter", () => {
  assertEquals(letter.parse("m"), {
    success: true,
    results: [{ value: "m", remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(letter.parse("1"), {
    success: false,
    message: parseErrors.letter,
    position: { line: 1, column: 0 },
  });
});

const twoLower = repeat(lower, 2).map((letters) => letters.join("")).error(
  "Expected two lowercase letters",
);

Deno.test("lower", () => {
  assertEquals(lower.parse("Hello"), {
    success: false,
    message: parseErrors.lower,
    position: { line: 1, column: 0 },
  });

  assertEquals(twoLower.parse("abcd"), {
    success: true,
    results: [{
      value: "ab",
      remaining: "cd",
      position: { line: 1, column: 2 },
    }],
  });

  assertEquals(twoLower.parse("aBcd"), {
    success: false,
    message: "Expected two lowercase letters",
    position: { line: 1, column: 0 },
  });
});

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

Deno.test("digit", () => {
  assertEquals(digit.parse("a"), {
    success: false,
    message: parseErrors.digit,
    position: { line: 1, column: 0 },
  });

  assertEquals(digit.parse("2"), {
    success: true,
    results: [{ value: 2, remaining: "", position: { line: 1, column: 1 } }],
  });

  assertEquals(digit.parse("23"), {
    success: true,
    results: [{ value: 2, remaining: "3", position: { line: 1, column: 1 } }],
  });
});

const even = filter(take, regexPredicate(/^[02468]/)).error(
  "Expected an even number",
);

Deno.test("filter even", () => {
  assertEquals(even.parse("2"), {
    success: true,
    results: [{
      value: "2",
      remaining: "",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(even.parse("1"), {
    success: false,
    message: "Expected an even number",
    position: { line: 1, column: 0 },
  });
});

Deno.test("literal", () => {
  assertEquals(literal("m").parse("a"), {
    success: false,
    message: "Expected 'm', but got 'a'",
    position: { line: 1, column: 0 },
  });

  assertEquals(literal("m").parse("monad"), {
    success: true,
    results: [{
      value: "m",
      remaining: "onad",
      position: { line: 1, column: 1 },
    }],
  });

  assertEquals(literal("hello").parse("hello there"), {
    success: true,
    results: [{
      value: "hello",
      remaining: " there",
      position: { line: 1, column: 5 },
    }],
  });

  assertEquals(literal("hello").parse("helicopter"), {
    success: false,
    message: "Expected 'hello', but got 'helic'",
    position: { line: 1, column: 0 },
  });
});

Deno.test("natural", () => {
  assertEquals(natural.parse("23 and more"), {
    success: true,
    results: [{
      value: 23,
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(natural.parse("and more"), {
    success: false,
    message: parseErrors.natural,
    position: { line: 1, column: 0 },
  });
});

Deno.test("integer", () => {
  assertEquals(integer.parse("23 and more"), {
    success: true,
    results: [{
      value: 23,
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(integer.parse("and more"), {
    success: false,
    message: parseErrors.integer,
    position: { line: 1, column: 0 },
  });

  assertEquals(integer.parse("-23 and more"), {
    success: true,
    results: [{
      value: -23,
      remaining: "and more",
      position: { line: 1, column: 4 },
    }],
  });
});

Deno.test("decimal", () => {
  assertEquals(decimal.parse("2.3 and more"), {
    success: true,
    results: [{
      value: 2.3,
      remaining: "and more",
      position: { line: 1, column: 4 },
    }],
  });

  assertEquals(decimal.parse("23 and more"), {
    success: false,
    message: parseErrors.decimal,
    position: { line: 1, column: 0 },
  });

  assertEquals(decimal.parse("-2.3 and more"), {
    success: true,
    results: [{
      value: -2.3,
      remaining: "and more",
      position: { line: 1, column: 5 },
    }],
  });
});

Deno.test("list of integers", () => {
  assertEquals(listOfInts.parse("[1 ,  -2, 3] and more"), {
    success: true,
    results: [{
      value: [1, -2, 3],
      remaining: "and more",
      position: { line: 1, column: 13 },
    }],
  });

  assertEquals(listOfInts.parse("[] and more"), {
    success: true,
    results: [{
      value: [],
      remaining: "and more",
      position: { line: 1, column: 3 },
    }],
  });

  assertEquals(listOfInts.parse("1 ,  -2, 3] and more"), {
    success: false,
    message: "Expected '[', but got '1'",
    position: { line: 1, column: 0 },
  });

  assertEquals(listOfInts.parse("[a ,  -2, 3] and more"), {
    success: false,
    message: "Expected ']', but got 'a'",
    position: { line: 1, column: 1 },
  });

  assertEquals(listOfInts.parse("[1  -2, 3] and more"), {
    success: false,
    message: "Expected ']', but got '-'",
    position: { line: 1, column: 4 },
  });
});
