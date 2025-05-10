import type { Parser } from "../../src/index.ts";
import { integer } from "./integer.ts";
import { listOf } from "./listOf.ts";

/**
 * Parses a list of integers
 */
export const listOfInts: Parser<number[]> = listOf(integer);
