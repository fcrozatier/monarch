import { createParser, type Parser } from "./parser.ts";

/**
 * The always failing parser
 *
 * It is the unit of alternation, and an absorbing element of bind
 */
export const fail: Parser<never> = createParser((_, position) => ({
  success: false,
  message: "",
  position,
}));
