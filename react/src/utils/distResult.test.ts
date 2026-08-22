import { describe, expect, it } from "vitest";
import { isDistResult } from "./distResult";

const validResult = {
  index: [
    {
      id: "category",
      name: "Category",
      files: [
        {
          path: "js/example.js",
          ruleset_json_path: "js/example.ruleset.json",
          metadata: {
            title: "Example",
            maintainers: ["maintainer"],
            rules: [
              {
                description: "Rule",
                description_notes: ["First note", "Second note"],
              },
            ],
          },
        },
      ],
    },
  ],
  example: [],
  search_suggestions: ["Caps Lock", "Mouse"],
  revision: "revision",
  updatedAt: 1_700_000_000,
};

describe("isDistResult", () => {
  it("accepts a valid result", () => {
    expect(isDistResult(validResult)).toBe(true);
  });

  it("rejects an invalid timestamp", () => {
    expect(isDistResult({ ...validResult, updatedAt: undefined })).toBe(false);
    expect(isDistResult({ ...validResult, updatedAt: Number.NaN })).toBe(false);
    expect(isDistResult({ ...validResult, updatedAt: -1 })).toBe(false);
    expect(isDistResult({ ...validResult, updatedAt: 1.5 })).toBe(false);
    expect(isDistResult({ ...validResult, updatedAt: 1e300 })).toBe(false);
    expect(isDistResult({ ...validResult, updatedAt: 8_640_000_000_001 })).toBe(
      false,
    );
  });

  it("rejects invalid search suggestions", () => {
    expect(
      isDistResult({ ...validResult, search_suggestions: undefined }),
    ).toBe(false);
    expect(
      isDistResult({ ...validResult, search_suggestions: ["Mouse", 1] }),
    ).toBe(false);
  });

  it("rejects invalid nested category data", () => {
    expect(
      isDistResult({
        ...validResult,
        index: [{ ...validResult.index[0], id: undefined }],
      }),
    ).toBe(false);
    expect(
      isDistResult({
        ...validResult,
        index: [
          {
            ...validResult.index[0],
            files: [
              {
                ...validResult.index[0].files[0],
                metadata: { maintainers: "maintainer" },
              },
            ],
          },
        ],
      }),
    ).toBe(false);
    expect(
      isDistResult({
        ...validResult,
        index: [
          {
            ...validResult.index[0],
            files: [{ path: "json/example.json", metadata: [] }],
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects a non-string ruleset JSON path", () => {
    expect(
      isDistResult({
        ...validResult,
        index: [
          {
            ...validResult.index[0],
            files: [
              {
                ...validResult.index[0].files[0],
                ruleset_json_path: 1,
              },
            ],
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects non-string rule description notes", () => {
    expect(
      isDistResult({
        ...validResult,
        index: [
          {
            ...validResult.index[0],
            files: [
              {
                ...validResult.index[0].files[0],
                metadata: {
                  ...validResult.index[0].files[0].metadata,
                  rules: [
                    {
                      description: "Rule",
                      description_notes: ["Note", 1],
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects available_since", () => {
    expect(
      isDistResult({
        ...validResult,
        index: [
          {
            ...validResult.index[0],
            files: [
              {
                ...validResult.index[0].files[0],
                metadata: {
                  ...validResult.index[0].files[0].metadata,
                  rules: [
                    {
                      description: "Rule",
                      available_since: "15.0.0",
                    },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toBe(false);
  });
});
