import { describe, expect, it } from "vitest";
import lunr from "lunr";
import {
  configureUnicodeTrimmer,
  getDocumentPriority,
  getEditDistance,
  searchIndex,
  titleIncludesSearchQuery,
} from "./search";

describe("getDocumentPriority", () => {
  it("gives author and maintainers the same priority", () => {
    expect(getDocumentPriority({ author: "author" })).toBe(2);
    expect(getDocumentPriority({ maintainers: ["maintainer"] })).toBe(2);
    expect(
      getDocumentPriority({
        author: "author",
        maintainers: ["maintainer"],
      }),
    ).toBe(2);
  });

  it("prioritizes extra descriptions within attributed rules", () => {
    expect(
      getDocumentPriority({ extraDescriptionPath: "description.html" }),
    ).toBe(1);
    expect(
      getDocumentPriority({
        author: "author",
        extraDescriptionPath: "description.html",
      }),
    ).toBe(3);
  });
});

describe("titleIncludesSearchQuery", () => {
  it("requires every query token in the title", () => {
    expect(
      titleIncludesSearchQuery("Universal Emacs Keybindings", "emacs"),
    ).toBe(true);
    expect(
      titleIncludesSearchQuery("Universal Emacs Keybindings", "Emacs Key"),
    ).toBe(true);
    expect(
      titleIncludesSearchQuery("Universal Emacs Keybindings", "Emacs Mouse"),
    ).toBe(false);
  });
});

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

  it("does not stem fuzzy search terms", () => {
    const stemmingIndex = lunr(function () {
      this.ref("id");
      this.field("text");
      this.add({ id: "emacs", text: "Emacs" });
      this.add({ id: "macos", text: "macOS" });
    });

    expect(
      searchIndex(stemmingIndex, "Emacs").map((result) => result.ref),
    ).toEqual(["emacs"]);
  });
});
