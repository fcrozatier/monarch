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
import {
  literal,
  regex,
  token,
  trimEnd,
  whitespace,
} from "@fcrozatier/monarch/common";

export type mElement = {
  tagName: string;
  kind: keyof typeof Kind;
  attributes: [string, string][];
  parent?: mElement;
  children?: mFragment;
};

export type mFragment = (mElement | string)[];

// https://html.spec.whatwg.org/#comments
export const comment = bracket(
  literal("<!--"),
  regex(/^(?!>|->)(?:.|\n)*?(?=(?:<\!--|-->|--!>|<!-)|$)/),
  literal("-->"),
);

export const comments = trimEnd(sepBy(whitespace, comment));

/**
 * Remove trailing spaces and comments
 */
const cleanEnd = <T>(parser: Parser<T>) =>
  parser.bind((p) => comments.bind(() => result(p)));

// https://html.spec.whatwg.org/#syntax-doctype
export const doctype = cleanEnd(
  sequence([
    trimEnd(regex(/^<!DOCTYPE/i)),
    trimEnd(regex(/^html/i)),
    literal(">"),
  ]).map(() => "<!DOCTYPE html>").error("Expected a valid doctype"),
);

// Tokens
const singleQuote = token("'");
const doubleQuote = token('"');

const rawText = regex(/^[^<]+/);

// Attributes
// https://html.spec.whatwg.org/#attributes-2
const attributeName = trimEnd(regex(/^[^ ="'>\/\u{fdd0}-\u{fdef}]+/u)).error(
  "Expected a valid attribute name",
);
const attributeValue = first(
  bracket(singleQuote, regex(/^[^']*/), singleQuote),
  bracket(doubleQuote, regex(/^[^"]*/), doubleQuote),
  regex(/^[^\s='"<>`]+/),
);

const attribute: Parser<[string, string]> = first(
  sequence([
    attributeName,
    token("="),
    attributeValue,
  ]).map(([name, _, value]) => [name.toLowerCase(), value]),
  attributeName.map((name) => [name.toLowerCase(), ""]),
);

// Tags
const tagName = trimEnd(regex(/^[a-zA-Z][a-zA-Z0-9-]*/)).map((name) =>
  name.toLowerCase()
).error("Expected an ASCII alphanumeric tag name");

const startTag: Parser<
  { tagName: string; attributes: [string, string][] }
> = sequence([
  literal("<"),
  tagName,
  trimEnd(sepBy(attribute, whitespace)),
  first(
    literal("/>"),
    literal(">"),
  ),
]).error("Expected a start tag").bind(([_, tagName, attributes, end]) => {
  const selfClosing = end === "/>";
  if (selfClosing && !voidElements.includes(tagName)) {
    return zero.error("Unexpected self-closing tag on a non-void element");
  }

  if (tagName !== "pre") {
    // trim comments inside the start tag of all non pre elements
    return comments.bind(() => result({ tagName, attributes }));
  }

  return result({ tagName, attributes });
});

export const element: Parser<mElement> = cleanEnd(
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
          value: { tagName, kind, attributes } satisfies mElement,
          remaining,
          position: openTagPosition,
        }],
      };
    }

    let childrenElementsParser: Parser<(string | mElement)[]>;
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
        first<mElement | string>(element, rawText),
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
        } satisfies mElement,
        remaining: res.results[0].remaining,
        position: res.results[0].position,
      }],
    };
  }),
);

export const fragments: Parser<mFragment> = sequence([
  comments,
  many(
    first<mElement | string>(element, rawText),
  ),
]).map(([_, element]) => element);

export const shadowRoot: Parser<mElement> = createParser(
  (input, position) => {
    const result = sequence([
      comments,
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
export const html: Parser<[string, mElement]> = sequence([
  comments,
  doctype,
  comments,
  element,
])
  .map(([_0, doctype, _1, document]) => [doctype, document]);

export const serializeFragment = (
  element: mElement | string,
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

const booleanAttributes = [
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
