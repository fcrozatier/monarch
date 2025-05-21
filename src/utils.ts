import type { Position } from "./core/types.ts";

/**
 * Computes the new position from the current position and the consumed string
 */
export const updatePosition = (
  position: Position,
  consumed: string,
): Position => {
  const lines = consumed.split("\n");
  const newLines = lines.length > 1;

  return {
    line: position.line + lines.length - 1,
    column: newLines
      ? lines.at(-1)!.length
      : position.column + lines.at(-1)!.length,
  };
};

/**
 * Sorts positions in a descending (line, column) order
 */
export const sortPosition = (a: Position, b: Position): number => {
  if (a.line !== b.line) return b.line - a.line;
  return b.column - a.column;
};
