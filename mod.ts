/**
 * Build parsers by composing structural combinators and chaining semantic refinements
 *
 * Combinators describe your grammar with function composition:
 *
 * - alternation
 * - iteration
 * - recursion
 * - reduction
 * - sequencing
 *
 * Refinements express semantic actions with method chaining:
 *
 * - customizing error messages
 * - filtering
 * - mapping
 * - skipping
 *
 * @module
 */

export * from "$combinators";
export * from "$core";
