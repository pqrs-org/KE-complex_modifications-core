// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchQueryContextProvider } from "../contexts";
import { Category, SEARCH_RESULT_CATEGORY_ID } from "../models";
import { TableOfContents } from "./TableOfContents";

const renderTableOfContents = (categories: Category[]) =>
  render(
    <SearchQueryContextProvider>
      <TableOfContents categories={categories} />
    </SearchQueryContextProvider>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.replaceChildren();
  window.history.replaceState(null, "", "/");
});

describe("TableOfContents", () => {
  it("encodes category IDs in links", () => {
    renderTableOfContents([
      new Category({
        id: "Examples: Others",
        name: "Examples: Others",
        files: [],
      }),
    ]);

    expect(
      screen
        .getByRole("link", { name: "Examples: Others" })
        .getAttribute("href"),
    ).toBe("#Examples%3A%20Others");
  });

  it("does not link the search result category", () => {
    renderTableOfContents([
      new Category({
        id: SEARCH_RESULT_CATEGORY_ID,
        name: "Search Result",
        files: [],
      }),
    ]);

    expect(screen.getByText("Search Result")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Search Result" })).toBeNull();
  });

  it("clears the search from the search result category", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.history.replaceState(null, "", "/?q=example");
    renderTableOfContents([
      new Category({
        id: SEARCH_RESULT_CATEGORY_ID,
        name: "Search Result",
        files: [],
      }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(window.location.href).toBe("http://localhost:3000/");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
  });

  it("moves the hash highlight before following a link", () => {
    const initialTarget = document.createElement("div");
    initialTarget.dataset.hashHighlighted = "true";
    const nextTarget = document.createElement("div");
    nextTarget.id = "next-category";
    document.body.append(initialTarget, nextTarget);

    renderTableOfContents([
      new Category({
        id: "next-category",
        name: "Next category",
        files: [],
      }),
    ]);

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
