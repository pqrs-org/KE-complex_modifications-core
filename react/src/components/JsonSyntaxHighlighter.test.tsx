// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import JsonSyntaxHighlighter from "./JsonSyntaxHighlighter";

afterEach(cleanup);

describe("JsonSyntaxHighlighter", () => {
  it("applies syntax colors to JSON tokens", () => {
    const view = render(
      <JsonSyntaxHighlighter>
        {JSON.stringify({ key: "value", enabled: true }, null, 2)}
      </JsonSyntaxHighlighter>,
    );

    const coloredTokens = view.container.querySelectorAll(
      "code span[style*='color']",
    );
    expect(coloredTokens.length).toBeGreaterThan(0);
  });
});
