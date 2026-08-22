import { describe, expect, it } from "vitest";
import { Category, KarabinerFile } from ".";

describe("KarabinerFile", () => {
  it("derives its id and URLs from the JSON path", () => {
    const file = new KarabinerFile({
      path: "json/example.rule.json",
      json: {},
    });

    expect(file.id).toBe("example.rule");
    expect(file.sourceUrl).toBe("json/example.rule.json");
    expect(file.shareUrl).toBe("?rule=json%2Fexample.rule.json");
    expect(file.isJavaScript).toBe(false);
  });

  it("recognizes JavaScript distribution paths", () => {
    const file = new KarabinerFile({
      path: "js/example.js",
      json: {},
    });

    expect(file.isJavaScript).toBe(true);
  });
});

describe("Category", () => {
  it("creates a model for each file", () => {
    const category = new Category({
      id: "examples",
      name: "Examples",
      files: [
        { path: "json/first.json", json: {} },
        { path: "json/second.json", json: {} },
      ],
    });

    expect(category.files.map((file) => file.id)).toEqual(["first", "second"]);
  });
});
