import { integer } from "./mod.ts";
import { list } from "./mod.ts";
import type { Parser } from "../index.ts";

/**
 * Parses a list of integers
 */

export const listOfInts: Parser<number[]> = list(integer);
