<div align="center">
  <img src="/assets/monarch.png" width="300" alt="">
</div>

# Monarch

Monarch is a full-featured type-safe parser combinator library with:

- Precise error messages reports with position
- Support for ambiguous grammars
- Support for context-sensitive grammars
- Support for left-recursive grammars with [fold](#foldl-and-foldr) and
  [lazy evaluation](#lazy-evaluation)
- Full type-safety

Easily build an error-reporting parser by combining, extending and customizing
the provided base parsers and their error messages.

## Installation

Depending on your runtime / package-manager:

```sh
deno add jsr:@fcrozatier/monarch
npx jsr add @fcrozatier/monarch
pnpm dlx jsr add @fcrozatier/monarch
yarn dlx jsr add @fcrozatier/monarch
```

## Examples

See the [`/examples`](/examples/) folder for an arithmetic expression
interpreter, a csv parser, as well as common utility parsers (digit, integer,
number, literal etc.)

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

### `take`

The `take` parser consumes the next character of the input

```js
const { results } = take.parse("hello"); // [{value: 'h', remaining: 'ello', ...}]
```

The return value is a string as `take` is a `Parser<string>`

### `repeat`

To apply a given parser a specific amount of times you can wrap it with the
`repeat<T>(parser: Parser<T>, times: number): Parser<T>` combinator

```js
const { results } = repeat(take, 2).parse("hello"); // [{value: 'he', remaining: 'llo', ...}]
```

### `literal`

To match against a specific character or keyword use the
`literal(value: string): Parser<string>` parser

```js
const dot = literal(".");
const { results } = dot.parse(".23"); // [{value: '.', remaining: '23', ...}]
const { message } = dot.parse("0.23"); // "Expected '.' but got '0'"
```

### `filter`

To specialize a parser you can filter it with a predicate. With
`filter<T>(parser: Parser<T>, predicate: (value: T)=> boolean):Parser<T>` the
filtered parser will only match if the predicate is satisfied.

You can easily create a regex predicate with the
`regexPredicate(regex: RegExp): (value: string) => boolean` helper

```js
const isVowel = (char) => ["a", "e", "i", "o", "u", "y"].includes(char);
const vowel = filter(take, isVowel).error("Expected a vowel");
const { results } = vowel.parse("a"); // [{value: '2', remaining: '', ...}]
const { message } = vowel.parse("1"); // "Expected a vowel"
```

You can easily customize the error message with the `error(msg: string)` method.

### `regex`

Often you only need a simple filtering based on a regex. The
`regex(re: RegExp):Parser<string>` utility will help with this use-case

```js
const even = regex(/^[02468]/).error("Expected an even number");
const { results } = even.parse("24"); // [{value: '2', remaining: '4', ...}]
const { message } = even.parse("ab"); // "Expected an even number"
```

### `many`

To apply a given parser as many times as possible (0 or more), wrap it with the
`many<T>(parser: Parser<T>): Parser<T[]>` combinator. To apply the given parser
1 or more times, use `many1`. Its success return value is an array of `T` values

```js
const digit = regex(/^\d/);
const { results } = many(digit).parse("23 and more"); // [{value: ["2", "3"], remaining: " and more", ...}]
```

### `map`

The `map<U>(fn: (value: T) => U): Parser<U>` method allows you to transform a
`Parser<T>` into a `Parser<U>` by applying the `fn` transform on the result
value

```js
const digit = regex(/^\d/).map(Number.parseInt);
const { results } = digit.parse("23 and more"); // [{value: 2, remaining: "3 and more", ...}]

const natural = many(digit).map((arr) => Number(arr.join("")));
const { results } = natural.parse("23 and more"); // [{value: 23, remaining: " and more", ...}]
```

Here the returned value is a number as `digit` and `natural` have the
`Parser<number>` type

### `sequence`

For a simple sequencing of parsers, use the
`sequence(parsers: Parser<?>[]): Parser<?[]>` combinator. The input parsers can
have different types, which will be reflected in the resulting parser

```ts
const parenthesizedNumber = sequence([literal("("), natural, literal(")")]); // inferred type: Parser<[string, number, string]>
const extract = parenthesizedNumber.map((arr) => arr[1]); // Parser<number>
const { results } = extract.parse("(42)"); // [{value: 42, remaining: "", ...}]
```

### `bind`

When you want more control over the sequencing, for dynamic parsing or if a
later operation depends on the result of a preceding parser, use `bind`. The
`bind(fn: (value: T)=> Parser<U>)` method allows you to bind the result of a
`Parser<T>` as the input of a function whose returned value is the next parser
in the sequence. Use the `result(value: T): Parser<T>` helper to end the
sequence with a final value lifted as a parser.

```ts
const letter = regex(/^[a-zA-Z]/);
const alphanumeric = many(regex(/^\w/)); // Parser<string[]>
const identifier = letter.bind((l) =>
  alphanumeric.map((rest) => [l, ...rest].join(""))
);

const { results } = identifier.parse("user1 = 'Bob'"); // [{value: "user1", remaining: " = 'Bob'", ...}]

const spaces = regex(/^\s*/);

/**
 * Discards the trailing spaces after a given parser
 */
const token = <T>(parser: Parser<T>) =>
  parser.bind((p) => spaces.bind((_) => result(p)));

const { results } = token(identifier).parse("ageUser1  = 42"); // [{value: "ageUser1", remaining: "= 42", ...}]
```

In the first example, the `identifier` parser is built by sequencing a single
letter with many alphanumeric characters and joining them together in a single
string parser by `map`ping the `alphanumeric` parser

In the second example, the `token` combinator takes a given parser, binds its
resulting value to the variable `p`, then applies the `spaces` parser, binds its
resulting value to the unused variable `_` and as a result of the sequence
returns `p`, effectively discarding the trailing spaces.

### `first` and `any`

When many parses are possible you can use the `any` combinator. Most of the time
you're only interested in the first matching alternative in which case you can
use the `first` combinator for performance – `any` always visits all branches
while `first` returns early.

```ts
const integer = first(
  literal("-").bind(() => natural).map((x) => -x),
  literal("+").bind(() => natural).map((x) => x),
  natural,
);

integer.parse("-42"); // results: [{value: -42, remaining: ''}]
integer.parse("+42"); // results: [{value: 42, remaining: ''}]
integer.parse("42"); // results: [{value: 42, remaining: ''}]
```

The integer parser above matches against signed integers, and we're only
interested in the result of the first matching alternative

### `sepBy`

It's common to have a pattern of tokens separated by a separator that should be
discarded. In these situations you can use
`sepBy<T, U>(parser: Parser<T>, separator: Parser<U>): Parser<T[]>` to recognize
such sequences and `sepBy1` for non-empty sequences

```ts
const listOfNumbers = bracket(
  literal("["),
  sepBy(number, literal(",")),
  literal("]"),
);

listOfNumbers.parse("[1,2,3]"); // results: [{value: [1,2,3], remaining: ""}]
```

### `foldL` and `foldR`

When the separator is meaningful as is the case with operators, you can use
`foldL<T>(item: Parser<T>, operator: Parser<(a:T, b:T) => T>): Parser<T>` and
`foldR` to reduce such sequences by respectively folding on the left or on the
right for operators that associate to the left or to the right. The `foldL1` and
`foldR1` combinators match non-empty sequences

```ts
const add = literal("+").map(() => (a: number, b: number) => a + b);
const addition = foldL(number, add);
addition.parse("1+2+3"); // results: [{value: 6, remaining: "" }]

const pow = literal("^").map(() => (a: number, b: number) => a ** b);
const exponentiation = foldR(number, pow);
exponentiation.parse("2^2^3"); // results: [{value: 2 ** 8, remaining: ""}]

const natural = foldL1(digit, result((a: number, b: number) => 10 * a + b));
natural.parse("123"); // results: [{value: 123, remaining: ""}]
```

Here we lift the addition literal `+` into a binary function parser and apply a
left fold. Similarly we lift the power literal `^` into a binary function parser
a apply a right fold since exponentiation associates to the right. We also
revisit the `natural` parser as a sequence of digits that are combined together
by folding a given operator around the digits.

### `memoize` and `lazy`

For recursive grammars you'll have circular dependencies between your parsers
which thus can't be written without referencing variables that are not yet
defined. In these situations you can use the `lazy` helper for thunking, and the
`memoize` helper to memoize the result of the thunk.

```ts
const add = literal("+").map(() => (a: number, b: number) => a + b);
const mul = literal("*").map(() => (a: number, b: number) => a * b);

// integer | (expr)
const factor = memoize(() =>
  first(
    integer,
    bracket(
      literal("("),
      expr,
      literal(")"),
    ),
  )
);
const term = foldL(factor, mul);
const expr = foldL(term, add);

expr.parse("1+2*3"); // results: [{value: 7, remaining: ""}]
```

Here a `factor` parser is an integer or a parenthesized expression and `memoize`
allows us to lazily evaluate and memoize this parser definition to avoid
directly referencing `expr` which is not yet defined.

### `iterate`

The `iterate<T>(parser: T): Parser<T[]>` combinator applies a given parser many
times, like the `many` combinator, but returns all the intermediate results.

```ts
iterate(digit).parse("42"); // results: [{value: [4, 2], remaining: ""}, {value: [4], remaining: "2"}, {value: [], remaining: "42"}]
```

## Parse errors

### Custom error message

You can easily customize the error message of a parser for easier debugging with
the `error(msg: string): this` method. This method returns the parser.

```js
const even = regex(/^[02468]/).error("Expected an even number");

const { results } = even.parse("24"); // [{value: '2', remaining: '4', ...}]
const { message } = even.parse("ab"); // "Expected an even number"
```

### `parseOrThrow`

Use `parseOrThrow(parser, input)` To assert that a parse should succeed and
return a value. It will return the first result value – the only one for
unambiguous grammars – or throw

```js
parseOrThrow(even, "ab");
//ParseError: at line 1, column 0
//	ab
//	^
//Reason: Expected an even number
```

## API Reference

Common parsers can be found in the `/examples/common.ts` module

### Base helpers

- result: `<T>(value: T) => Parser<T>`: The default embedding of a value in the
  Parser context
- zero: The always failing parser

### Sequencing

- sequence: `(parsers: Parser<?>[]) => Parser<?>`: Makes a sequence of parses
  and returns the array of parse results
- bracket:
  `<T, U, V>(open: Parser<T>, body: Parser<U>, close: Parser<V>) => Parser<U>`:
  utility combinator for the common open/body/close pattern

### Iteration

- iterate: `<T>(parser: Parser<T>) => Parser<T[]>`: Returns an array of all
  iterated parses
- repeat: `<T>(parser: Parser<T>, times: number) => Parser<T[]>`: Repeats a
  parser a predefined number of times
- many: `<T>(parser: Parser<T>) => Parser<T[]>`: Returns the longest matching
  parse array (0 or more matches)
- many1: Returns the longest matching parse array (1 or more matches)
- sepBy: `<T, U>(parser: Parser<T>,sep: Parser<U>) => Parser<T[]>`: Recognizes
  sequences (maybe empty) of a given parser and separator, and ignores the
  separator
- sepBy1: Recognizes non-empty sequences of a given parser and separator, and
  ignores the separator
- foldL:
  `<T, U extends (a: T, b: T) => T>(item: Parser<T>,operator: Parser<U>) => Parser<T>`:
  Parses maybe-empty sequences of items separated by an operator parser that
  associates to the left and performs the fold
- foldL1: Parses non-empty sequences of items separated by an operator parser
  that associates to the left and performs the fold
- foldR: Parses maybe-empty sequences of items separated by an operator parser
  that associates to the right and performs the fold
- foldR1: Parses non-empty sequences of items separated by an operator parser
  that associates to the right and performs the fold

### Alternation

- any: `<T>(...parsers: Parser<T>[]) => Parser<T>`: Returns all matching parses
- first: `<T>(...parsers: Parser<T>[]) => Parser<T>`: Only returns the first
  successful parse result

### Lazy evaluation

- memoize: `<T>(parserThunk: () => Parser<T>) => Parser<T>`: Takes a parser
  thunk and memoize it upon evaluation.
- lazy: `<T>(parserThunk: () => Parser<T>) => Parser<T>`: Defers evaluation,
  without memoization

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
