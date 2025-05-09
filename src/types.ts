export type Position = {
  line: number;
  column: number;
};

export type ParseFail = {
  success: false;
  message: string;
  position: Position;
};

export type ParseSuccess<T> = {
  success: true;
  results: {
    value: T;
    remaining: string;
    position: Position;
  }[];
};

export type ParseResult<T> = ParseSuccess<T> | ParseFail;

export type ParsingHandler<T> = (
  input: string,
  position: Position,
) => ParseResult<T>;
