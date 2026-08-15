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
            rules: [{ description: "Rule" }],
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
});
