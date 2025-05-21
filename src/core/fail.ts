import { createParser, type Parser } from "./parser.ts";

/**
 * The always failing parser
 */
export const fail: Parser<never> = createParser((_, position) => ({
  success: false,
  message: "",
  position,
}));
