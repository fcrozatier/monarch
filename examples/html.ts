import {
  bracket,
  createParser,
  first,
  many,
  type Parser,
  result,
  sepBy,
  sequence,
  zero,
} from "@fcrozatier/monarch";
import { literal, regex, whitespace, whitespaces } from "./common.ts";

type MCommentNode = {
  kind: "COMMENT";
  text: string;
};

type MSpacesAndComments = (MTextNode | MCommentNode)[];

type MTextNode = {
  kind: "TEXT";
  text: string;
};

type MNode = MCommentNode | MTextNode | MElement;

export type MFragment = MNode[];

export type MElement = {
  tagName: string;
  kind: keyof typeof Kind;
  attributes: [string, string][];
  parent?: MElement;
  children?: MFragment;
};

export const textNode = (
  text: string,
) => ({ kind: "TEXT", text } satisfies MTextNode);

const whitespaceOnlyText = whitespaces.map(textNode);

export const commentNode = (
  text: string,
) => ({ kind: "COMMENT", text } satisfies MCommentNode);

/**
 * Parses an HTML comment
 *
 * @ref https://html.spec.whatwg.org/#comments
 */
export const comment: Parser<MCommentNode> = bracket(
  literal("<!--"),
  regex(/^(?!>|->)(?:.|\n)*?(?=(?:<\!--|-->|--!>|<!-)|$)/),
  literal("-->"),
).map((text) => commentNode(text));

/**
 * Parses a sequence of comments maybe surrounded by whitespace
 */
export const spacesAndComments: Parser<MSpacesAndComments> = sequence(
  [
    whitespaceOnlyText,
    sepBy(comment, whitespaces),
    whitespaceOnlyText,
  ],
).map(([space1, comments, space2]) => [space1, ...comments, space2]);

/**
 * Parses a modern HTML doctype
 *
 * @ref https://html.spec.whatwg.org/#syntax-doctype
 */
export const doctype: Parser<string> = sequence([
  regex(/^<!DOCTYPE/i),
  whitespace.skip(whitespaces),
  regex(/^html/i).skip(whitespaces),
  literal(">"),
]).map(() => "<!DOCTYPE html>").error("Expected a valid doctype");

const singleQuote = literal("'");
const doubleQuote = literal('"');
const rawText = regex(/^[^<]+/).map(textNode);

/**
 * Parses an HTML attribute name
 *
 * @ref https://html.spec.whatwg.org/#attributes-2
 */
const attributeName = regex(/^[^\s="'>\/\p{Noncharacter_Code_Point}]+/u)
  .skip(whitespaces)
  .map((name) => name.toLowerCase())
  .error("Expected a valid attribute name");

const attributeValue = first(
  bracket(singleQuote, regex(/^[^']*/), singleQuote),
  bracket(doubleQuote, regex(/^[^"]*/), doubleQuote),
  regex(/^[^\s='"<>`]+/),
);

export const attribute: Parser<[string, string]> = first<[string, string]>(
  sequence([
    attributeName,
    literal("=").skip(whitespaces),
    attributeValue,
  ]).map(([name, _, value]) => [name, value]),
  attributeName.map((name) => [name, ""]),
).skip(whitespaces);

// Tags
const tagName = regex(/^[a-zA-Z][a-zA-Z0-9-]*/)
  .skip(whitespaces)
  .map((name) => name.toLowerCase())
  .error("Expected an ASCII alphanumeric tag name");

const startTag: Parser<
  { tagName: string; attributes: [string, string][] }
> = sequence([
  literal("<"),
  tagName,
  many(attribute),
  regex(/\/?>/),
]).error("Expected a start tag").bind(([_, tagName, attributes, end]) => {
  const selfClosing = end === "/>";
  if (selfClosing && !voidElements.includes(tagName)) {
    return zero.error("Unexpected self-closing tag on a non-void element");
  }

  return result({ tagName, attributes });
});

export const element: Parser<MElement> = createParser((input, position) => {
  const openTag = startTag.parse(input, position);

  if (!openTag.success) return openTag;

  const {
    value: { tagName, attributes },
    remaining,
    position: openTagPosition,
  } = openTag.results[0];

  const kind = elementKind(tagName);

  if (kind === Kind.VOID || !remaining) {
    return {
      success: true,
      results: [{
        value: { tagName, kind, attributes } satisfies MElement,
        remaining,
        position: openTagPosition,
      }],
    };
  }

  let childrenElementsParser: Parser<MFragment>;
  const endTagParser = regex(new RegExp(`^</${tagName}>`, "i")).error(
    `Expected a '</${tagName}>' end tag`,
  );

  if (
    kind === Kind.RAW_TEXT ||
    kind === Kind.ESCAPABLE_RAW_TEXT
  ) {
    // https://html.spec.whatwg.org/#cdata-rcdata-restrictions
    const rawText = regex(
      new RegExp(`^(?:(?!<\/${tagName}(?:>|\n|\/)).|\n)*`, "i"),
    ).map((t) => t.length > 0 ? [textNode(t)] : []);

    childrenElementsParser = rawText;
  } else {
    childrenElementsParser = fragments;
  }

  const childrenElements = childrenElementsParser.parse(
    remaining,
    openTagPosition,
  );

  if (!childrenElements.success) return childrenElements;

  const {
    value: children,
    remaining: childrenRemaining,
    position: childrenPosition,
  } = childrenElements.results[0];

  const res = endTagParser.parse(childrenRemaining, childrenPosition);

  // End tag omission would be managed here
  if (!res.success) return res;

  return {
    success: true,
    results: [{
      value: {
        tagName,
        kind,
        attributes,
        children,
      } satisfies MElement,
      remaining: res.results[0].remaining,
      position: res.results[0].position,
    }],
  };
});

export const fragments: Parser<MNode[]> = many(
  first<MNode>(element, comment, rawText),
);

export const shadowRoot: Parser<readonly [MSpacesAndComments, MElement]> =
  createParser(
    (input, position) => {
      const result = sequence([
        spacesAndComments,
        element,
      ]).parse(input, position);

      if (!result.success) return result;

      const maybeTemplate = result.results[0].value[1];
      if (maybeTemplate.tagName !== "template") {
        return {
          success: false,
          message: "Expected a template element",
          position,
        };
      }

      if (
        !maybeTemplate.attributes.find(([k, v]) =>
          k === "shadowrootmode" && v === "open"
        )
      ) {
        return {
          success: false,
          message: "Expected a declarative shadow root",
          position,
        };
      }

      return result;
    },
  );

/**
 * Parses an html document: a doctype and an html element maybe surrounded by whitespace and comments
 *
 * https://html.spec.whatwg.org/#writing
 */
export const html: Parser<
  [MCommentNode[], string, MCommentNode[], MElement, MCommentNode[]]
> = sequence([
  spacesAndComments,
  doctype,
  spacesAndComments,
  element,
  spacesAndComments,
])
  .map((
    [comments1, doctype, comments2, document, comments3],
  ) => [
    comments1.filter((c) => c.kind === "COMMENT"),
    doctype,
    comments2.filter((c) => c.kind === "COMMENT"),
    document,
    comments3.filter((c) => c.kind === "COMMENT"),
  ]);

type SerializationOptions = { removeComments?: boolean };

export const serializeNode = (
  node: MNode,
  options?: SerializationOptions,
): string => {
  const { removeComments } = Object.assign(
    {},
    { removeComments: false },
    options,
  );

  if (node.kind === "TEXT") return node.text;
  if (node.kind === "COMMENT") {
    return removeComments ? "" : `<!--${node.text}-->`;
  }

  const attributes = node.attributes.map(([k, v]) => {
    const quotes = v.includes('"') ? "'" : '"';
    return booleanAttributes.includes(k) ? k : `${k}=${quotes}${v}${quotes}`;
  });

  const attributesString = attributes.length > 0
    ? ` ${attributes.join(" ")}`
    : "";
  const startTag = `<${node.tagName}${attributesString}>`;

  if (node.kind === Kind.VOID) return startTag;

  const content = node.children
    ? node.children.map((node) => serializeNode(node, options))
      .join("")
    : "";
  return `${startTag}${content}</${node.tagName}>`;
};

export const serializeFragments = (
  fragment: MFragment,
  options?: SerializationOptions,
) => {
  return fragment.map((node) => serializeNode(node, options)).join("");
};

/**
 * The different types of elements
 */
export const Kind = {
  VOID: "VOID",
  RAW_TEXT: "RAW_TEXT",
  ESCAPABLE_RAW_TEXT: "ESCAPABLE_RAW_TEXT",
  CUSTOM: "CUSTOM",
  NORMAL: "NORMAL",
} as const;

/**
 * Associate a tag name to its corresponding element kind
 */
const elementKind = (tag: string): keyof typeof Kind => {
  if (voidElements.includes(tag)) return Kind.VOID;
  if (rawTextElements.includes(tag)) return Kind.RAW_TEXT;
  if (escapableRawTextElements.includes(tag)) return Kind.ESCAPABLE_RAW_TEXT;
  if (tag.includes("-")) return Kind.CUSTOM;
  return Kind.NORMAL;
};

const voidElements = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "source",
  "track",
  "wbr",
];

const rawTextElements = ["script", "style"];
const escapableRawTextElements = ["textarea", "title"];

export const booleanAttributes = [
  "allowfullscreen", // on <iframe>
  "async", // on <script>
  "autofocus", // on <button>, <input>, <select>, <textarea>
  "autoplay", // on <audio>, <video>
  "checked", // on <input type="checkbox">, <input type="radio">
  "controls", // on <audio>, <video>
  "default", // on <track>
  "defer", // on <script>
  "disabled", // on form elements like <button>, <fieldset>, <input>, <optgroup>, <option>,<select>, <textarea>
  "formnovalidate", // on <button>, <input type="submit">
  "hidden", // global
  "inert", // global
  "ismap", // on <img>
  "itemscope", // global; part of microdata
  "loop", // on <audio>, <video>
  "multiple", // on <input type="file">, <select>
  "muted", // on <audio>, <video>
  "nomodule", // on <script>
  "novalidate", // on <form>
  "open", // on <details>
  "readonly", // on <input>, <textarea>
  "required", // on <input>, <select>, <textarea>
  "reversed", // on <ol>
  "selected", // on <option>
];
