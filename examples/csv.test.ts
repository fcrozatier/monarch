import { assertEquals } from "@std/assert";
import { csv, headings, row } from "./csv.ts";

const data = `
"name", "sex", "age", "height", "weight"
"Alex",  "M",   41,   74,           170
"Bert",  "M",   42,   68,           166
"Carl",  "M",   32,   70,           155
`.trimStart();

Deno.test("csv heading", () => {
  const headingsData = `"name", "sex", "age", "height", "weight"\n`;
  assertEquals(headings.parse(headingsData), {
    success: true,
    results: [{
      value: [
        "name",
        "sex",
        "age",
        "height",
        "weight",
      ],
      remaining: ``,
      position: { line: 2, column: 0 },
    }],
  });
});

Deno.test("csv row", () => {
  const rowData = `"Alex",  "M",   41,   74,           170\n`;
  assertEquals(row.parse(rowData), {
    success: true,
    results: [{
      value: [
        "Alex",
        "M",
        41,
        74,
        170,
      ],
      remaining: ``,
      position: { line: 2, column: 0 },
    }],
  });
});

Deno.test("csv", () => {
  assertEquals(csv.parse(data), {
    success: true,
    results: [{
      value: [
        { name: "Alex", sex: "M", age: 41, height: 74, weight: 170 },
        { name: "Bert", sex: "M", age: 42, height: 68, weight: 166 },
        { name: "Carl", sex: "M", age: 32, height: 70, weight: 155 },
      ],
      remaining: "",
      position: { line: 5, column: 0 },
    }],
  });
});
