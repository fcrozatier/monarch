/**
 * Real-life examples, including a CSV parser, an HTML parser and an arithmetic expression parser
 *
 * @module
 */

export { csv } from "./csv.ts";
export {
  booleanAttributes,
  commentNode,
  fragments,
  html,
  Kind,
  type MCommentNode,
  type MElement,
  type MFragment,
  type MNode,
  type MSpacesAndComments,
  type MTextNode,
  type SerializationOptions,
  serializeFragments,
  serializeNode,
  shadowRoot,
  textNode,
} from "./html.ts";
export { expr } from "./arithmetic-expressions.ts";
