/**
 * Build parsers by composing structural combinators and chaining semantic refinements
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
 * For a introductory walkthrough of the various combinators, see the following [guide](https://github.com/fcrozatier/monarch?tab=readme-ov-file#getting-started-guide)
 *
 * @module
 */

export * from "$combinators";
export * from "$core";
