// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Category } from "../models";
import { TableOfContents } from "./TableOfContents";

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
});

describe("TableOfContents", () => {
  it("encodes category IDs in links", () => {
    render(
      <TableOfContents
        categories={[
          new Category({
            id: "Examples: Others",
            name: "Examples: Others",
            files: [],
          }),
        ]}
      />,
    );

    expect(
      screen
        .getByRole("link", { name: "Examples: Others" })
        .getAttribute("href"),
    ).toBe("#Examples%3A%20Others");
  });

  it("moves the hash highlight before following a link", () => {
    const initialTarget = document.createElement("div");
    initialTarget.dataset.hashHighlighted = "true";
    const nextTarget = document.createElement("div");
    nextTarget.id = "next-category";
    document.body.append(initialTarget, nextTarget);

    render(
      <TableOfContents
        categories={[
          new Category({
            id: "next-category",
            name: "Next category",
            files: [],
          }),
        ]}
      />,
    );

    const link = screen.getByRole("link", { name: "Next category" });
    link.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(link);

    expect(initialTarget.hasAttribute("data-hash-highlighted")).toBe(false);
    expect(
      document.getElementById("next-category")?.dataset.hashHighlighted,
    ).toBe("true");
  });
});
