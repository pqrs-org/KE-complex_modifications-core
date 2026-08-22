import { describe, expect, it } from "vitest";
import { Category, KarabinerFile } from ".";

describe("KarabinerFile", () => {
  it("derives its id and URLs from the JSON path", () => {
    const file = new KarabinerFile({
      path: "json/example.rule.json",
      metadata: {},
    });

    expect(file.id).toBe("example.rule");
    expect(file.sourceUrl).toBe("json/example.rule.json");
    expect(file.rulesetJsonUrl).toBeUndefined();
    expect(file.shareUrl).toBe("?rule=json%2Fexample.rule.json");
    expect(file.isJavaScript).toBe(false);
  });

  it("recognizes JavaScript distribution paths", () => {
    const file = new KarabinerFile({
      path: "js/example.js",
      ruleset_json_path: "js/example.ruleset.json",
      metadata: {},
    });

    expect(file.isJavaScript).toBe(true);
    expect(file.rulesetJsonUrl).toBe("js/example.ruleset.json");
  });
});

describe("Category", () => {
  it("creates a model for each file", () => {
    const category = new Category({
      id: "examples",
      name: "Examples",
      files: [
        { path: "json/first.json", metadata: {} },
        { path: "json/second.json", metadata: {} },
      ],
    });

    expect(category.files.map((file) => file.id)).toEqual(["first", "second"]);
  });
});
