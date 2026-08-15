// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { decodeLocationHash, toAbsoluteUrl, toKarabinerImportUrl } from "./url";

describe("toAbsoluteUrl", () => {
  it("resolves a relative URL against the supplied base URL", () => {
    expect(
      toAbsoluteUrl("../images/example.png", "https://example.com/docs/page/"),
    ).toBe("https://example.com/docs/images/example.png");
  });

  it("preserves an absolute URL", () => {
    expect(
      toAbsoluteUrl(
        "https://cdn.example.com/example.png",
        "https://example.com/",
      ),
    ).toBe("https://cdn.example.com/example.png");
  });

  it("returns an invalid URL unchanged", () => {
    expect(toAbsoluteUrl("http://[", "https://example.com/")).toBe("http://[");
  });
});

describe("toKarabinerImportUrl", () => {
  it("creates a custom protocol URL containing the absolute JSON URL", () => {
    expect(toKarabinerImportUrl("json/example rule.json")).toBe(
      `karabiner://karabiner/assets/complex_modifications/import?url=${encodeURIComponent(
        new URL("json/example rule.json", document.baseURI).href,
      )}`,
    );
  });
});

describe("decodeLocationHash", () => {
  it("decodes a percent-encoded hash", () => {
    expect(decodeLocationHash("#Examples%3A%20Others")).toBe(
      "Examples: Others",
    );
  });

  it("leaves a malformed encoded hash unchanged", () => {
    expect(decodeLocationHash("#invalid%E0%A4%A")).toBe("invalid%E0%A4%A");
  });
});
