<div align="center">
  <img src="/assets/monarch.png" width="300" alt="">
</div>

# Monarch

Monarch is a clean, composable parser combinator library that makes building
parsers feel natural and expressive:

- Clean & readable API
- Type-safe parsing
- Precise error reports with position
- Support for custom error messages
- Support for ambiguous grammars
- Support for context-sensitive grammars
- Support for left-recursive grammars with [fold](#foldl-and-foldr) and
  [lazy evaluation](#lazy-evaluation)

Easily build error-reporting parsers by combining, extending and customizing the
provided base parsers and their error messages.

## Table of content

- [Monarch](#monarch)
  - [Table of content](#table-of-content)
  - [Installation](#installation)
  - [Examples](#examples)
  - [Getting Started Guide](#getting-started-guide)
    - [`anyChar`](#anychar)
    - [`repeat`](#repeat)
    - [`literal`](#literal)
    - [`filter`](#filter)
    - [`regex`](#regex)
    - [`many`](#many)
    - [`map`](#map)
    - [`seq`](#seq)
    - [`chain`](#chain)
    - [`skipTrailing` and `skipLeading`](#skiptrailing-and-skipleading)
    - [`alt` and `any`](#alt-and-any)
    - [`sepBy`](#sepby)
    - [`foldL` and `foldR`](#foldl-and-foldr)
    - [`memoize` and `lazy`](#memoize-and-lazy)
    - [`iterate`](#iterate)
  - [Parse errors](#parse-errors)
    - [Custom error message](#custom-error-message)
    - [`parseOrThrow`](#parseorthrow)
  - [API](#api)
  - [References](#references)

## Installation

Depending on your runtime / package-manager:

```sh
deno add jsr:@fcrozatier/monarch
npx jsr add @fcrozatier/monarch
pnpm dlx jsr add @fcrozatier/monarch
yarn dlx jsr add @fcrozatier/monarch
```

## Examples

The [`/examples`](/examples/) folder contains an arithmetic expression
interpreter, a csv parser and an html parser

Common utility parsers (digit, integer, number, literal etc.) are provided in
the `common` module

## Getting Started Guide

A parser is an instance of the `Parser<T>` class which implements the
`parse(input: string): ParseResult<T>` method.

A `ParseResult` is either a `ParseError` with an `error` message and position,
or a successful parse with a results array containing `T` values, the
`remaining` string to parse and the `position`

```ts
type Position = {
  line: number;
  column: number;
};

type ParseError = {
  success: false;
  message: string;
  position: Position;
};

type ParseResult<T> = {
  success: true;
  results: {
    value: T;
    remaining: string;
    position: Position;
  }[];
} | ParseError;
```

Under the hood the `Parser<T>` generic class is a Monad, but no knowledge of
this structure is required to use the library. See the [References](#references)
section for more.

Here's a progressive introduction to the various available base parsers and
combinators of the library.

### `anyChar`

The `anyChar` parser consumes the next character of the input

```ts
import { anyChar } from "@fcrozatier/monarch/common";

anyChar.parse("hello");
// [{value: 'h', remaining: 'ello', ...}]
```

The return value is a string as `anyChar` is a `Parser<string>`

### `repeat`

To apply a given parser a specific amount of times you can wrap it with the
`repeat<T>(parser: Parser<T>, times: number): Parser<T>` combinator

```ts
import { repeat } from "@fcrozatier/monarch";
import { anyChar } from "@fcrozatier/monarch/common";

repeat(anyChar, 2).parse("hello");
// [{value: 'he', remaining: 'llo', ...}]
```

### `literal`

To match against a specific character or keyword use the
`literal(value: string): Parser<string>` parser

```ts
import { literal } from "@fcrozatier/monarch/common";

const dot = literal(".");

dot.parse(".23");
// [{value: '.', remaining: '23', ...}]

dot.parse("0.23");
// "Expected '.' but got '0'"
```

### `filter`

To specialize a parser you can filter it with a predicate. Use the
`filter<T>(predicate: (value: T) => boolean): Parser<T>` method to filter a
parser. A filtered parser only matches when the predicate is satisfied.

```ts
import { anyChar } from "@fcrozatier/monarch/common";

const isVowel = (char: string) => ["a", "e", "i", "o", "u", "y"].includes(char);
const vowel = anyChar.filter(isVowel).error("Expected a vowel");

vowel.parse("a");
// [{value: '2', remaining: '', ...}]

vowel.parse("1");
// "Expected a vowel"
```

You can easily customize the error message with the `error(msg: string)` method.

### `regex`

Often you only need a simple filtering based on a regex. The
`regex(re: RegExp): Parser<string>` utility will help with this use-case

```ts
import { regex } from "@fcrozatier/monarch/common";

const even = regex(/^[02468]/).error("Expected an even number");

even.parse("24");
// [{value: '2', remaining: '4', ...}]

even.parse("ab");
// "Expected an even number"
```

### `many`

To apply a given parser as many times as possible (0 or more), wrap it with the
`many<T>(parser: Parser<T>): Parser<T[]>` combinator. To apply the given parser
1 or more times, use `many1`. Its success return value is an array of `T` values

```ts
import { many } from "@fcrozatier/monarch";
import { regex } from "@fcrozatier/monarch/common";

const digit = regex(/^\d/);

many(digit).parse("23 and more");
// [{value: ["2", "3"], remaining: " and more", ...}]
```

### `map`

The `map<U>(fn: (value: T) => U): Parser<U>` method allows you to transform a
`Parser<T>` into a `Parser<U>` by applying the `fn` transform on the result
value

```ts
import { many } from "@fcrozatier/monarch";
import { regex } from "@fcrozatier/monarch/common";

const digit = regex(/^\d/).map(Number.parseInt);

digit.parse("23 and more");
// [{value: 2, remaining: "3 and more", ...}]

const natural = many(digit).map((arr) => Number(arr.join("")));

natural.parse("23 and more");
// [{value: 23, remaining: " and more", ...}]
```

Here the returned value is a number as `digit` and `natural` have the
`Parser<number>` type

### `seq`

For a simple sequencing of parsers, use the
`seq(...parsers: Parser<?>[]): Parser<?[]>` combinator. The input parsers can
have different types, which will be reflected in the resulting parser

```ts
import { seq } from "@fcrozatier/monarch";
import { literal, natural } from "@fcrozatier/monarch/common";

const parenthesizedNumber = seq(literal("("), natural, literal(")"));
// inferred type: Parser<[string, number, string]>

const extract = parenthesizedNumber.map((arr) => arr[1]); // Parser<number>
extract.parseOrThrow("(42)"); // 42
```

### `chain`

When you want more control over the sequencing, for dynamic parsing or if a
later operation depends on the result of a preceding parser, use `chain`. The
`chain(fn: (value: T)=> Parser<U>)` method allows you to chain the result of a
`Parser<T>` with the next parser of the sequence. Use the
`result(value: T): Parser<T>` helper to end the sequence with a final value
lifted as a parser.

```ts
import { many, type Parser, result } from "@fcrozatier/monarch";
import { regex } from "@fcrozatier/monarch/common";

const letter = regex(/^[a-zA-Z]/);
const alphanumeric = many(regex(/^\w/)); // Parser<string[]>
const identifier = letter.chain((l) =>
  alphanumeric.map((rest) => [l, ...rest].join(""))
);

identifier.parse("user1 = 'Bob'"); // [{value: "user1", remaining: " = 'Bob'", ...}]

const spaces = regex(/^\s*/);

/**
 * Discards the trailing spaces after a given parser
 */
const token = <T>(parser: Parser<T>) =>
  parser.chain((p: T) => spaces.chain((_) => result(p)));

token(identifier).parse("ageUser1  = 42");
// [{value: "ageUser1", remaining: "= 42", ...}]
```

In the first example, the `identifier` parser is built by sequencing a single
letter with many alphanumeric characters and joining them together in a single
string parser by `map`ping the `alphanumeric` parser

In the second example, the `token` combinator takes a given parser, binds its
resulting value to the variable `p`, then applies the `spaces` parser, binds its
resulting value to the unused variable `_` and as a result of the sequence
returns `p`, effectively discarding the trailing spaces.

### `skipTrailing` and `skipLeading`

The `skipTrailing` method is a convenient shorthand when you need to ignore the
result of the next parser. Similarly `skipLeading` allows you to ignore the
result of the previous parser. We can rewrite the `token` parser from the
previous section as follows:

```ts
import { type Parser, result } from "@fcrozatier/monarch";
import { spaces } from "@fcrozatier/monarch/common";

/**
 * Discards the trailing spaces after a given parser
 */
const token = <T>(parser: Parser<T>) =>
  parser.chain((p) => spaces.chain((_) => result(p)));

// Equivalent
const token2 = <T>(parser: Parser<T>) => parser.skipTrailing(spaces);
```

### `alt` and `any`

When many parses are possible you can use the `any` combinator. Most of the time
you're only interested in the first matching alternative in which case you can
use the `alt` combinator for performance – `any` always visits all branches
while `alt` returns early.

```ts
import { alt } from "@fcrozatier/monarch";
import { literal, natural } from "@fcrozatier/monarch/common";

const integer = alt(
  literal("-").chain(() => natural).map((x) => -x),
  literal("+").chain(() => natural).map((x) => x),
  natural,
);

integer.parseOrThrow("-42"); // -42
integer.parseOrThrow("+42"); // 42
integer.parseOrThrow("42"); // 42
```

The integer parser above matches against signed integers, and we're only
interested in the result of the first matching alternative

### `sepBy`

It's common to have a pattern of tokens separated by a separator that should be
discarded. In these situations you can use
`sepBy<T, U>(parser: Parser<T>, separator: Parser<U>): Parser<T[]>` to recognize
such sequences and `sepBy1` for non-empty sequences

```ts
import { between, sepBy } from "@fcrozatier/monarch";
import { literal, number } from "@fcrozatier/monarch/common";

const listOfNumbers = between(
  literal("["),
  sepBy(number, literal(",")),
  literal("]"),
);

listOfNumbers.parseOrThrow("[1,2,3]"); // [1,2,3]
```

### `foldL` and `foldR`

When the separator is meaningful as is the case with operators, you can use
`foldL<T>(item: Parser<T>, operator: Parser<(a:T, b:T) => T>): Parser<T>` and
`foldR` to reduce such sequences by respectively folding on the left or on the
right for operators that associate to the left or to the right. The `foldL1` and
`foldR1` combinators match non-empty sequences

```ts
import { foldL, foldL1, foldR, result } from "@fcrozatier/monarch";
import { digit, literal, number } from "@fcrozatier/monarch/common";

const add = literal("+").map(() => (a: number, b: number) => a + b);
const addition = foldL(number, add);
addition.parse("1+2+3"); // results: [{value: 6, remaining: "" }]

const pow = literal("^").map(() => (a: number, b: number) => a ** b);
const exponentiation = foldR(number, pow);
exponentiation.parse("2^2^3"); // results: [{value: 256, remaining: ""}]

const natural = foldL1(digit, result((a: number, b: number) => 10 * a + b));
natural.parse("123"); // results: [{value: 123, remaining: ""}]
```

Here we lift the addition literal `+` into a binary function parser and apply a
left fold. Similarly we lift the power literal `^` into a binary function parser
and apply a right fold since exponentiation associates to the right. We also
revisit the `natural` parser as a sequence of digits that are combined together
by folding a given operator around the digits.

### `memoize` and `lazy`

For recursive grammars you'll have circular dependencies between your parsers
which thus can't be written without referencing variables that are not yet
defined. In these situations you can use the `lazy` helper for thunking, and the
`memoize` helper to memoize the result of the thunk.

```ts
import { alt, between, foldL, lazy, type Parser } from "@fcrozatier/monarch";
import { integer, literal } from "@fcrozatier/monarch/common";

const add = literal("+").map(() => (a: number, b: number) => a + b);
const mul = literal("*").map(() => (a: number, b: number) => a * b);

// integer | (expr)
const factor = lazy(() =>
  alt(
    integer,
    between(
      literal("("),
      expr,
      literal(")"),
    ),
  )
);
const term = foldL(factor, mul);
const expr: Parser<number> = foldL(term, add);

expr.parseOrThrow("1+2*3"); // 7
```

Here a `factor` parser is an integer or a parenthesized expression and `memoize`
allows us to lazily evaluate and memoize this parser definition to avoid
directly referencing `expr` which is not yet defined.

### `iterate`

The `iterate<T>(parser: T): Parser<T[]>` combinator applies a given parser many
times, like the `many` combinator, but returns all the intermediate results.

```ts
import { iterate } from "@fcrozatier/monarch";
import { digit } from "@fcrozatier/monarch/common";

iterate(digit).parse("42");
//[
// {value: [4, 2], remaining: ""},
// {value: [4], remaining: "2"},
// {value: [], remaining: "42"}
//]
```

## Parse errors

### Custom error message

You can easily customize the error message of a parser for easier debugging with
the `error(msg: string): this` method. This method returns the parser.

```ts
import { regex } from "@fcrozatier/monarch/common";

const even = regex(/^[02468]/).error("Expected an even number");

even.parse("24"); // [{value: '2', remaining: '4', ...}]
even.parse("ab"); // "Expected an even number"
```

### `parseOrThrow`

Use the `parseOrThrow(input: string)` method to assert that a parser should
successfully parse an input and return a value. This method returns the first
result value – the only one for unambiguous grammars – or throws.

```ts
import { regex } from "@fcrozatier/monarch/common";

const even = regex(/^[02468]/).error("Expected an even number");

try {
  even.parseOrThrow("ab");
} catch (error) {
  console.log(error);
  //ParseError: at line 1, column 0
  //	ab
  //	^
  //Reason: Expected an even number
}
```

## [API](https://jsr.io/@fcrozatier/monarch/doc)

## References

- Monads for functional programming, Philip Wadler
  https://homepages.inf.ed.ac.uk/wadler/papers/marktoberdorf/baastad.pdf

- Monadic parser combinators, G Hutton, E Meijer - 1996
  https://people.cs.nott.ac.uk/pszgmh/monparsing.pdf

- Jeroen Fokker. Functional parsers. In Advanced Functional Programming, First
  International Spring School, LNCS, 925:1–23, B˚astad, Sweden, May 1995

- Parsec: Direct Style Monadic Parser Combinators For The Real World, Daan
  Leijen, Erik Meijer User Modeling 2007, 11th International Conference, UM
  2007, Corfu, Greece, June 25-29, 2007
  https://www.microsoft.com/en-us/research/publication/parsec-direct-style-monadic-parser-combinators-for-the-real-world/
