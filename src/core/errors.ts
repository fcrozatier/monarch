import type { Position } from "./types.ts";

/**
 * The ParseError class
 */
export class ParseError extends Error {
  /** @internal */
  constructor(
    { line, column }: Position,
    reason: string,
    sourceSnippet?: string,
  ) {
    const snippet = sourceSnippet
      ? `\n\t${sourceSnippet}\n\t${" ".repeat(column)}^`
      : "";
    super(
      `at line ${line}, column ${column}${snippet}\nReason: ${reason}`,
    );

    this.name = this.constructor.name;
    Error.captureStackTrace(this, ParseError);
  }
}

/**
 * @internal
 */
export const parseErrors = {
  takeError: "Unexpected end of input",

  whitespace: "Expected whitespace",

  letter: "Expected a letter",
  lower: "Expected a lowercase letter",
  upper: "Expected an uppercase letter",

  digit: "Expected a digit",
  natural: "Expected a natural number",
  integer: "Expected an integer",
  decimal: "Expected a decimal number",
  number: "Expected a number",
};
