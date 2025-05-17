import type { Parser } from "$core";
import { parseErrors } from "../errors.ts";
import { regex } from "./mod.ts";

/**
 * Parses the newline character
 *
 * Regex \n
 */
export const newline: Parser<string> = regex(/^\n/);

/**
 * Parses many newlines (0+)
 *
 * Regex \n*
 */
export const newlines: Parser<string> = regex(/^\n*/);

/**
 * Parses many newlines (1+)
 *
 * Regex \n+
 */
export const newlines1: Parser<string> = regex(/^\n+/);

/**
 * Parses the space character (0+)
 */
export const spaces: Parser<string> = regex(/^ */);

/**
 * Parses a single white space
 *
 * Regex \s
 *
 * @throws Throws "Expected a white space character" when the parse fails
 */
export const whitespace: Parser<string> = regex(/^\s/).error(
  parseErrors.whitespace,
);

/**
 * Parses whitespaces (0+)
 *
 * Regex: \s*
 */
export const whitespaces: Parser<string> = regex(/^\s*/);

/**
 * Parses whitespaces (1+)
 *
 * Regex: \s+
 */
export const whitespaces1: Parser<string> = regex(/^\s+/);
