// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { toAbsoluteUrl } from "./url";

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
