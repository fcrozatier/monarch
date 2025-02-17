import { assertEquals } from "@std/assert";
import {
  attribute,
  comment,
  doctype,
  element,
  fragments,
  Kind,
} from "../examples/html.ts";

Deno.test("doctype", () => {
  const res = doctype.parseOrThrow("<!Doctype Html >");

  assertEquals(res, "<!DOCTYPE html>");
});

Deno.test("comments_simple", () => {
  const singleline = comment.parseOrThrow("<!-- A simple comment -->");
  assertEquals(singleline, { kind: "COMMENT", text: " A simple comment " });

  const multiline = comment.parseOrThrow(`<!--
     A
     multiline
     comment
     -->`);
  assertEquals(multiline, {
    kind: "COMMENT",
    text: `
     A
     multiline
     comment
     `,
  });
});

Deno.test("comments_complex", () => {
  const comments = fragments.parseOrThrow(`
    <!-- consecutive comments -->
    <!-- arrows ->-> -- > ->->->-- -> inside comments -->
    <div>
      <!-- <span>html inside comment</span> -->
    </div>
  `);

  assertEquals(comments, [{
    tagName: "div",
    kind: Kind.NORMAL,
    attributes: [],
    children: [],
  }]);
});

Deno.test("comments_nested", () => {
  const nestedComments = fragments.parseOrThrow(`
    <!-- This is a div -->

    <div>

      <!-- This is a p -->
      <p>
        Some text
        <!-- This is a button -->
        <button>click</button>
        <!-- Now below the button -->
      </p>

      <!-- Another section -->

      <!-- Another p -->
      <p>
        <input type="checkbox"> <!-- An input -->
      </p>
    </div>
    `);

  assertEquals(nestedComments, [{
    tagName: "div",
    kind: Kind.NORMAL,
    attributes: [],
    children: [{
      tagName: "p",
      kind: Kind.NORMAL,
      attributes: [],
      children: [
        "Some text\n        ",
        {
          tagName: "button",
          kind: Kind.NORMAL,
          attributes: [],
          children: ["click"],
        },
      ],
    }, {
      tagName: "p",
      kind: Kind.NORMAL,
      attributes: [],
      children: [
        {
          tagName: "input",
          kind: Kind.VOID,
          attributes: [["type", "checkbox"]],
        },
      ],
    }],
  }]);
});

Deno.test("void_element", () => {
  const input = element.parseOrThrow('<input type="text">');
  assertEquals(input, {
    tagName: "input",
    kind: Kind.VOID,
    attributes: [["type", "text"]],
  });
});

Deno.test("void_elements", () => {
  const content = fragments.parseOrThrow(
    '<form><img src="something.png"><br><input type=submit value=Ok /></form>',
  );
  assertEquals(content, [{
    tagName: "form",
    kind: Kind.NORMAL,
    attributes: [],
    children: [
      {
        tagName: "img",
        kind: Kind.VOID,
        attributes: [["src", "something.png"]],
      },
      { tagName: "br", kind: Kind.VOID, attributes: [] },
      {
        tagName: "input",
        kind: Kind.VOID,
        attributes: [["type", "submit"], ["value", "Ok"]],
      },
    ],
  }]);
});

Deno.test("style element", () => {
  const style = element.parseOrThrow(`
    <style>
      .box {
        color: blue;
      }
    </style>
    `.trim());

  assertEquals(style, {
    tagName: "style",
    kind: Kind.RAW_TEXT,
    attributes: [],
    children: [`.box {
        color: blue;
      }
    `],
  });
});

Deno.test("script element", () => {
  const script = element.parseOrThrow(`
    <script>
      <
      </
      </s
      </sc
      </scr
      </scri
      </scrip
      console.log(1 < 2);
    </script>
    `.trim());

  assertEquals(script, {
    tagName: "script",
    kind: Kind.RAW_TEXT,
    attributes: [],
    children: [`<
      </
      </s
      </sc
      </scr
      </scri
      </scrip
      console.log(1 < 2);
    `],
  });
});

Deno.test("empty script", () => {
  const script = element.parseOrThrow(
    `<script type="module" src="/src/module.js"></script>`,
  );

  assertEquals(script, {
    tagName: "script",
    kind: Kind.RAW_TEXT,
    attributes: [["type", "module"], ["src", "/src/module.js"]],
    children: [""],
  });
});

Deno.test("empty span", () => {
  const span = element.parseOrThrow(
    `<span class="icon"></span>`,
  );

  assertEquals(span, {
    tagName: "span",
    kind: Kind.NORMAL,
    attributes: [["class", "icon"]],
    children: [],
  });
});

Deno.test("nested elements", () => {
  const nested = element.parseOrThrow(`
    <div>
      <p>
        <button>click</button>
      </p>
      <p>
        Multi-line
        text
      </p>
      <p>
        <input type="checkbox">
      </p>
    </div>
    `.trim());

  assertEquals(nested, {
    tagName: "div",
    kind: Kind.NORMAL,
    attributes: [],
    children: [
      {
        tagName: "p",
        kind: Kind.NORMAL,
        attributes: [],
        children: [
          {
            tagName: "button",
            kind: Kind.NORMAL,
            attributes: [],
            children: ["click"],
          },
        ],
      },
      {
        tagName: "p",
        kind: Kind.NORMAL,
        attributes: [],
        children: [
          "Multi-line\n        text\n      ",
        ],
      },
      {
        tagName: "p",
        kind: Kind.NORMAL,
        attributes: [],
        children: [
          {
            tagName: "input",
            kind: Kind.VOID,
            attributes: [["type", "checkbox"]],
          },
        ],
      },
    ],
  });
});

Deno.test("attributes", () => {
  const unquotedAttribute = attribute.parseOrThrow(`value=yes`);
  assertEquals(unquotedAttribute, ["value", "yes"]);

  const singleQuoteAttribute = attribute.parseOrThrow(`type='text'`);
  assertEquals(singleQuoteAttribute, ["type", "text"]);

  const doubleQuotesAttribute = attribute.parseOrThrow(`class="a b c"`);
  assertEquals(doubleQuotesAttribute, ["class", "a b c"]);

  const booleanAttribute = attribute.parseOrThrow(`checked`);
  assertEquals(booleanAttribute, ["checked", ""]);

  const nonAsciiAttribute = attribute.parseOrThrow(`xml:lang="us"`);
  assertEquals(nonAsciiAttribute, ["xml:lang", "us"]);

  const hangingBracket = element.parseOrThrow(
    `<input
    disabled
    >`,
  );
  assertEquals(hangingBracket, {
    tagName: "input",
    kind: Kind.VOID,
    attributes: [
      [
        "disabled",
        "",
      ],
    ],
  });

  const recoverFromMissingWhiteSpace = element.parseOrThrow(
    `<input value="yes"class="a b c">`,
  );
  assertEquals(recoverFromMissingWhiteSpace, {
    tagName: "input",
    kind: Kind.VOID,
    attributes: [
      ["value", "yes"],
      ["class", "a b c"],
    ],
  });

  const allowDuplicateAttributes = element.parseOrThrow(
    `<input @on="click:handleClick" @on="mouseenter:handleHover">`,
  );
  assertEquals(allowDuplicateAttributes, {
    tagName: "input",
    kind: Kind.VOID,
    attributes: [
      ["@on", "click:handleClick"],
      ["@on", "mouseenter:handleHover"],
    ],
  });
});

Deno.test("custom tags", () => {
  const res = fragments.parseOrThrow(`
    <something-different>
      <atom-text-editor mini>
        Hello
      </atom-text-editor>
    </something-different>
    `);

  assertEquals(res, [{
    tagName: "something-different",
    kind: Kind.CUSTOM,
    attributes: [],
    children: [
      {
        tagName: "atom-text-editor",
        kind: Kind.CUSTOM,
        attributes: [["mini", ""]],
        children: ["Hello\n      "],
      },
    ],
  }]);
});

Deno.test("entities", () => {
  const raw = fragments.parseOrThrow(`
    <p>Named entities: &nbsp; dolor sit &copy; amet.</p>
    <p>Numeric entities: &#160; dolor sit &#8212; amet.</p>
    <p>Misc entities: &#xA0; dolor &#xa0; sit &nbsp; amet.</p>
  `);

  assertEquals(raw, [{
    tagName: "p",
    kind: Kind.NORMAL,
    attributes: [],
    children: [`Named entities: &nbsp; dolor sit &copy; amet.`],
  }, {
    tagName: "p",
    kind: Kind.NORMAL,
    attributes: [],
    children: ["Numeric entities: &#160; dolor sit &#8212; amet."],
  }, {
    tagName: "p",
    kind: Kind.NORMAL,
    attributes: [],
    children: ["Misc entities: &#xA0; dolor &#xa0; sit &nbsp; amet."],
  }]);
});
