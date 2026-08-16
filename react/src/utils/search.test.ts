import { describe, expect, it } from "vitest";
import lunr from "lunr";
import {
  configureUnicodeTrimmer,
  getEditDistance,
  searchIndex,
} from "./search";

describe("getEditDistance", () => {
  it.each([
    ["JIS", 0],
    ["Vims", 0],
    ["Mouse", 1],
    ["Windows", 1],
    ["Keychron", 2],
  ] as const)("returns the edit distance for %s", (query, expected) => {
    expect(getEditDistance(query)).toBe(expected);
  });
});

describe("searchIndex", () => {
  const index = lunr(function () {
    this.ref("id");
    this.field("text");
    this.add({ id: "hyper-key", text: "Hyper Key" });
    this.add({ id: "key-only", text: "Key remapping" });
    this.add({ id: "hyper-only", text: "Hyper shortcuts" });
  });

  it("requires every query token to match", () => {
    expect(searchIndex(index, "Hyper Key").map((result) => result.ref)).toEqual(
      ["hyper-key"],
    );
  });

  it("retains single-token search", () => {
    expect(searchIndex(index, "Hyper").map((result) => result.ref)).toEqual([
      "hyper-key",
      "hyper-only",
    ]);
  });

  it("uses prefix matching for ASCII tokens", () => {
    const prefixIndex = lunr(function () {
      this.ref("id");
      this.field("text");
      this.add({ id: "exact", text: "Key" });
      this.add({ id: "prefix", text: "Keyboard" });
      this.add({ id: "substring", text: "Monkey" });
    });

    expect(
      searchIndex(prefixIndex, "key")
        .map((result) => result.ref)
        .sort(),
    ).toEqual(["exact", "prefix"]);
  });

  it("uses substring matching for non-ASCII tokens", () => {
    const substringIndex = lunr(function () {
      configureUnicodeTrimmer(this);
      this.ref("id");
      this.field("text");
      this.add({ id: "japanese", text: "特殊キー" });
      this.add({ id: "unrelated", text: "特殊マウス" });
    });

    expect(
      searchIndex(substringIndex, "キー").map((result) => result.ref),
    ).toEqual(["japanese"]);
  });
});
