// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LinkifiedText } from "./LinkifiedText";

afterEach(cleanup);

describe("LinkifiedText", () => {
  it("links an URL while preserving surrounding text", () => {
    render(
      <div>
        <LinkifiedText>
          {"See https://example.com/hello/こんにちは for details"}
        </LinkifiedText>
      </div>,
    );

    const link = screen.getByRole("link", {
      name: "https://example.com/hello/こんにちは",
    });
    expect(link.getAttribute("href")).toBe(
      "https://example.com/hello/こんにちは",
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
    expect(link.parentElement?.textContent).toBe(
      "See https://example.com/hello/こんにちは for details",
    );
  });

  it("uses a closing parenthesis and whitespace as URL boundaries", () => {
    render(
      <div>
        <p>
          <LinkifiedText>{"(https://example.com/foo/bar)"}</LinkifiedText>
        </p>
        <p>
          <LinkifiedText>
            {"(https://example.com/foo/bar comment)"}
          </LinkifiedText>
        </p>
      </div>,
    );

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "https://example.com/foo/bar",
      "https://example.com/foo/bar",
    ]);
    expect(links[0].parentElement?.textContent).toBe(
      "(https://example.com/foo/bar)",
    );
    expect(links[1].parentElement?.textContent).toBe(
      "(https://example.com/foo/bar comment)",
    );
  });

  it("keeps balanced parentheses inside an URL", () => {
    render(
      <div>
        <LinkifiedText>
          {"https://example.com/function_(value) after"}
        </LinkifiedText>
      </div>,
    );

    expect(
      screen.getByRole("link", {
        name: "https://example.com/function_(value)",
      }),
    ).not.toBeNull();
  });

  it("shortens only GitHub profile links", () => {
    render(
      <div>
        <LinkifiedText>
          {
            "https://github.com/example and github.com/bare-user but https://github.com/example/repository"
          }
        </LinkifiedText>
      </div>,
    );

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "@example",
      "@bare-user",
      "https://github.com/example/repository",
    ]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "https://github.com/example",
      "https://github.com/bare-user",
      "https://github.com/example/repository",
    ]);
  });

  it("does not link URL-like suffixes embedded in other text", () => {
    render(
      <div>
        <LinkifiedText>
          {
            "sub.github.com/example user@github.com/example ssh://github.com/example abchttps://example.com"
          }
        </LinkifiedText>
      </div>,
    );

    expect(screen.queryByRole("link")).toBeNull();
  });

  it("links URLs immediately following Japanese text", () => {
    render(
      <div>
        <p>
          <LinkifiedText>{"詳細はhttps://example.com"}</LinkifiedText>
        </p>
        <p>
          <LinkifiedText>{"作者github.com/example"}</LinkifiedText>
        </p>
      </div>,
    );

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual([
      "https://example.com",
      "@example",
    ]);
  });

  it("keeps links accessible above an overlaid control", () => {
    render(
      <div>
        <LinkifiedText overlaidByControl>
          {"Read https://example.com/docs now"}
        </LinkifiedText>
      </div>,
    );

    const link = screen.getByRole("link", {
      name: "https://example.com/docs",
    });
    expect(link.getAttribute("aria-hidden")).toBeNull();
    expect(link.previousElementSibling?.getAttribute("aria-hidden")).toBe(
      "true",
    );
    expect(link.nextElementSibling?.getAttribute("aria-hidden")).toBe("true");
  });
});
