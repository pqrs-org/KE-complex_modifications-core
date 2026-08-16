import { describe, expect, it } from "vitest";
import { isDistResult } from "./distResult";

const validResult = {
  index: [
    {
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          json: {
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
                json: { maintainers: "maintainer" },
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
            files: [{ path: "json/example.json", json: [] }],
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
                json: {
                  ...validResult.index[0].files[0].json,
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
                json: {
                  ...validResult.index[0].files[0].json,
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
