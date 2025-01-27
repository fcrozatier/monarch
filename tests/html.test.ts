import { assertEquals } from "@std/assert";
import {
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

Deno.test("comment", () => {
  const simple = comment.parseOrThrow("<!-- A simple comment -->");
  assertEquals(simple, " A simple comment ");

  const multiline = comment.parseOrThrow(`<!--
     A
     multiline
     comment
     -->`);

  assertEquals(
    multiline.trim(),
    `A
     multiline
     comment`,
  );
});

Deno.test("comments", () => {
  const comments = fragments.parseOrThrow(`
    <!-- hello -->
    <!-- world ->-> -- > ->->->-- -> still comment -->
    <div>
      <!-- <span>something</span> -->
    </div>
  `);

  assertEquals(comments, [{
    tagName: "div",
    kind: Kind.NORMAL,
    attributes: [],
    children: [],
  }]);
});

Deno.test("nested comments", () => {
  const nestedComments = fragments.parseOrThrow(`
    <!-- This is a div -->

    <div>

      <!-- This is a p -->
      <p>
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

Deno.test("void element", () => {
  const input = element.parseOrThrow('<input type="text">');
  assertEquals(input, {
    tagName: "input",
    kind: Kind.VOID,
    attributes: [["type", "text"]],
  });
});

Deno.test("void elements", () => {
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
  const res = element.parseOrThrow(
    '<input value=yes class="a b c" type=\'text\' checked xml:lang="us">',
  );

  assertEquals(res, {
    tagName: "input",
    kind: Kind.VOID,
    attributes: [["value", "yes"], ["class", "a b c"], ["type", "text"], [
      "checked",
      "",
    ], ["xml:lang", "us"]],
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
