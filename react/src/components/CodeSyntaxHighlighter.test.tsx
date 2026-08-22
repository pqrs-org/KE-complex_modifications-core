// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import CodeSyntaxHighlighter from "./CodeSyntaxHighlighter";

afterEach(cleanup);

describe("CodeSyntaxHighlighter", () => {
  it("applies syntax colors to JSON tokens", () => {
    const view = render(
      <CodeSyntaxHighlighter>
        {JSON.stringify({ key: "value", enabled: true }, null, 2)}
      </CodeSyntaxHighlighter>,
    );

    const coloredTokens = view.container.querySelectorAll(
      "code span[style*='color']",
    );
    expect(coloredTokens.length).toBeGreaterThan(0);
  });

  it("applies syntax colors to JavaScript tokens", () => {
    const view = render(
      <CodeSyntaxHighlighter language="javascript">
        {"function main() { return {}; }"}
      </CodeSyntaxHighlighter>,
    );

    expect(
      view.container.querySelectorAll("code span[style*='color']").length,
    ).toBeGreaterThan(0);
  });
});
