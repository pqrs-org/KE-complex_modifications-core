import { describe, expect, it } from "vitest";
import { Category, KarabinerJsonFile } from ".";

describe("KarabinerJsonFile", () => {
  it("derives its id and URLs from the JSON path", () => {
    const file = new KarabinerJsonFile({ path: "json/example.rule.json" });

    expect(file.id).toBe("example.rule");
    expect(file.jsonUrl).toBe("json/example.rule.json");
    expect(file.anchorUrl).toBe("#example.rule");
  });

  it("uses empty values when the path is omitted", () => {
    const file = new KarabinerJsonFile({});

    expect(file.id).toBe("");
    expect(file.jsonUrl).toBe("");
    expect(file.anchorUrl).toBe("");
  });
});

describe("Category", () => {
  it("creates a model for each file", () => {
    const category = new Category({
      id: "examples",
      files: [{ path: "json/first.json" }, { path: "json/second.json" }],
    });

    expect(category.files.map((file) => file.id)).toEqual(["first", "second"]);
  });
});
