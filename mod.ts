/**
 * ## Features
 *
 * - Clean & readable API
 * - Type-safe parsing
 * - Precise error reports with position
 * - Support for custom error messages
 * - Support for ambiguous grammars
 * - Support for context-sensitive grammars
 * - Support for left-recursive grammars with fold and lazy evaluation
 *
 * Easily build error-reporting parsers by combining, extending and customizing
the provided base parsers and their error messages.
 *
 * ## Structural Combinators &  Semantic Refinements
 *
 * To build parsers with Monarch you compose structural combinators and chain semantic refinements.
 *
 * Combinators describe your grammar with function composition:
 *
 * - [alternation](https://jsr.io/@fcrozatier/monarch/doc/~/alt)
 * - [iteration](https://jsr.io/@fcrozatier/monarch/doc/~/many)
 * - [recursion](https://jsr.io/@fcrozatier/monarch/doc/~/lazy)
 * - [reduction](https://jsr.io/@fcrozatier/monarch/doc/~/foldL)
 * - [sequencing](https://jsr.io/@fcrozatier/monarch/doc/~/seq)
 *
 * Refinements express semantic actions with method chaining:
 *
 * - [customizing error messages](https://jsr.io/@fcrozatier/monarch/doc/~/Parser.prototype.error)
 * - [filtering](https://jsr.io/@fcrozatier/monarch/doc/~/Parser.prototype.filter)
 * - [mapping](https://jsr.io/@fcrozatier/monarch/doc/~/Parser.prototype.map)
 * - [skipping](https://jsr.io/@fcrozatier/monarch/doc/~/Parser.prototype.skipTrailing)
 *
 * ## Guide
 *
 * For a introductory walkthrough of the various combinators, see the following [guide](https://github.com/fcrozatier/monarch?tab=readme-ov-file#getting-started-guide)
 *
 * @module
 */

export * from "$combinators";
export * from "$core";
