/**
 * The current position in the source
 *
 * @internal
 */
export type Position = {
  line: number;
  column: number;
};

/**
 * The fail state
 */
export type ParseFail = {
  success: false;
  message: string;
  position: Position;
};

/**
 * The success state
 */
export type ParseSuccess<T> = {
  success: true;
  results: {
    value: T;
    remaining: string;
    position: Position;
  }[];
};

/**
 * The parse result
 */
export type ParseResult<T> = ParseSuccess<T> | ParseFail;

/**
 * The {@linkcode createParser} callback
 */
export type ParsingHandler<T> = (
  input: string,
  position: Position,
) => ParseResult<T>;
