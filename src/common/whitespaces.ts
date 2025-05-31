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
 * Parses zero or more newlines
 *
 * Regex \n*
 */
export const newlines: Parser<string> = regex(/^\n*/);

/**
 * Parses one or more newlines
 *
 * Regex \n+
 */
export const newlines1: Parser<string> = regex(/^\n+/);

/**
 * Parses zero or more spaces
 */
export const spaces: Parser<string> = regex(/^ */);

/**
 * Parses a single whitespace
 *
 * Regex \s
 *
 * @throws Throws "Expected whitespace" when the parse fails
 */
export const whitespace: Parser<string> = regex(/^\s/).error(
  parseErrors.whitespace,
);

/**
 * Parses zero or more whitespaces
 *
 * Regex: \s*
 */
export const whitespaces: Parser<string> = regex(/^\s*/);

/**
 * Parses one or more whitespaces
 *
 * Regex: \s+
 */
export const whitespaces1: Parser<string> = regex(/^\s+/);
