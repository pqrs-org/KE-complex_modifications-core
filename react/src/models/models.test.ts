import { describe, expect, it } from "vitest";
import { Category, KarabinerJsonFile } from ".";

describe("KarabinerJsonFile", () => {
  it("derives its id and URLs from the JSON path", () => {
    const file = new KarabinerJsonFile({
      path: "json/example.rule.json",
      json: {},
    });

    expect(file.id).toBe("example.rule");
    expect(file.jsonUrl).toBe("json/example.rule.json");
    expect(file.shareUrl).toBe("?rule=json%2Fexample.rule.json");
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
