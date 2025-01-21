import { assertEquals } from "@std/assert";
import { csv } from "../examples/csv.ts";

const data = `
"name", "sex", "age", "height", "weight"
"Alex",  "M",   41,   74,           170;
"Bert",  "M",   42,   68,           166;
"Carl",  "M",   32,   70,           155`.trim();

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
      position: { line: 4, column: 39 },
    }],
  });
});
