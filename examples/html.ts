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

type MNode = MCommentNode | MWhiteSpaceNode | MElement;

type MCommentNode = {
  kind: "COMMENT";
  text: string;
};

type MWhiteSpaceNode = {
  kind: "WHITESPACE";
};

export type MElement = {
  tagName: string;
  kind: keyof typeof Kind;
  attributes: [string, string][];
  parent?: MElement;
  children?: MFragment;
};

export type MFragment = (MElement | string)[];

const newCommentNode = (
  text: string,
) => ({ kind: "COMMENT", text } satisfies MCommentNode);

const newWhiteSpaceNode =
  () => ({ kind: "WHITESPACE" } satisfies MWhiteSpaceNode);

/**
 * Parses an HTML comment
 *
 * @ref https://html.spec.whatwg.org/#comments
 */
export const comment: Parser<MCommentNode> = bracket(
  literal("<!--"),
  regex(/^(?!>|->)(?:.|\n)*?(?=(?:<\!--|-->|--!>|<!-)|$)/),
  literal("-->"),
).map((text) => newCommentNode(text));

/**
 * Parses a sequence of comments surrounded by whitespace, and discards the whole match
 */
export const spaceAroundComments: Parser<string> = (sepBy(whitespaces, comment))
  .skip(whitespaces)
  .map(() => "");

/**
 * Remove trailing spaces and comments
 */
const cleanEnd = <T>(parser: Parser<T>) => parser.skip(spaceAroundComments);

/**
 * Parses a modern HTML doctype
 *
 * @ref https://html.spec.whatwg.org/#syntax-doctype
 */
export const doctype: Parser<string> = cleanEnd(
  sequence([
    regex(/^<!DOCTYPE/i),
    whitespace.skip(whitespaces),
    regex(/^html/i).skip(whitespaces),
    literal(">"),
  ]).map(() => "<!DOCTYPE html>").error("Expected a valid doctype"),
);

// Tokens
const singleQuote = literal("'");
const doubleQuote = literal('"');

const rawText = cleanEnd(regex(/^[^<]+/));

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

  if (tagName !== "pre") {
    // Trim comments inside the start tag of all non pre elements
    // New lines at the start of pre blocks are ignored by the HTML parser but a space followed by a newline is not
    // https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inbody
    return spaceAroundComments.bind(() => result({ tagName, attributes }));
  }

  return result({ tagName, attributes });
});

export const element: Parser<MElement> = cleanEnd(
  createParser((input, position) => {
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

    let childrenElementsParser: Parser<(string | MElement)[]>;
    const endTagParser = regex(new RegExp(`^</${tagName}>\\s*`, "i")).error(
      `Expected a '</${tagName}>' end tag`,
    );

    if (
      kind === Kind.RAW_TEXT ||
      kind === Kind.ESCAPABLE_RAW_TEXT
    ) {
      // https://html.spec.whatwg.org/#cdata-rcdata-restrictions
      const rawText = regex(
        new RegExp(`^(?:(?!<\/${tagName}(?:>|\n|\\s|\/)).|\n)*`, "i"),
      );
      childrenElementsParser = rawText.map((t) => [t]);
    } else {
      childrenElementsParser = many(
        first<MElement | string>(element, rawText),
      );
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
  }),
);

export const fragments: Parser<MFragment> = sequence([
  spaceAroundComments,
  many(
    first<MElement | string>(element, rawText),
  ),
]).map(([_, element]) => element);

export const shadowRoot: Parser<MElement> = createParser(
  (input, position) => {
    const result = sequence([
      spaceAroundComments,
      element,
    ]).map(([_, element]) => element).parse(input, position);

    if (!result.success) return result;

    const { value: maybeTemplate } = result.results[0];
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

// https://html.spec.whatwg.org/#writing
export const html: Parser<[string, MElement]> = sequence([
  spaceAroundComments,
  doctype,
  spaceAroundComments,
  element,
])
  .map(([_0, doctype, _1, document]) => [doctype, document]);

export const serializeFragment = (
  element: MElement | string,
): string => {
  if (typeof element === "string") return element;

  const attributes = element.attributes.map(([k, v]) => {
    const quotes = v.includes('"') ? "'" : '"';
    return booleanAttributes.includes(k) ? k : `${k}=${quotes}${v}${quotes}`;
  });

  const attributesString = attributes.length > 0
    ? ` ${attributes.join(" ")}`
    : "";
  const startTag = `<${element.tagName}${attributesString}>\n`;

  if (element.kind === Kind.VOID) return startTag;

  const content = element.children
    ? element.children?.map(serializeFragment).join("")
    : "";

  return `${startTag}${content.trimEnd()}\n</${element.tagName}>\n`;
};

export const Kind = {
  VOID: "VOID",
  RAW_TEXT: "RAW_TEXT",
  ESCAPABLE_RAW_TEXT: "ESCAPABLE_RAW_TEXT",
  CUSTOM: "CUSTOM",
  NORMAL: "NORMAL",
} as const;

export const elementKind = (tag: string): keyof typeof Kind => {
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
