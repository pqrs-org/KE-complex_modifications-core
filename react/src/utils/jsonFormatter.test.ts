import { describe, expect, it } from "vitest";
import { formatJson } from "./jsonFormatter";

describe("formatJson", () => {
  it("keeps primitive arrays and single-key objects on one line", () => {
    expect(
      formatJson({
        empty_array: [],
        modifiers: ["left_command", "left_shift"],
        from: { key_code: "a" },
        nested: { first: { second: "value" } },
      }),
    ).toBe(`{
    "empty_array": [],
    "modifiers": ["left_command", "left_shift"],
    "from": { "key_code": "a" },
    "nested": { "first": { "second": "value" } }
}`);
  });

  it("writes arrays containing multiple objects across multiple lines", () => {
    expect(
      formatJson({
        rules: [{ description: "First" }, { description: "Second" }],
      }),
    ).toBe(`{
    "rules": [
        { "description": "First" },
        { "description": "Second" }
    ]
}`);
  });

  it("forces selected Karabiner-Elements arrays onto multiple lines", () => {
    expect(formatJson({ bundle_identifiers: ["^com\\.example\\.Example$"] }))
      .toBe(`{
    "bundle_identifiers": [
        "^com\\\\.example\\\\.Example$"
    ]
}`);
  });
});
