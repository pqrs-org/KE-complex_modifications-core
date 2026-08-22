// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CodeModalContextProvider, SnackbarContextProvider } from "../contexts";
import { Category, SEARCH_RESULT_CATEGORY_ID } from "../models";
import { CategoryBox } from "./CategoryBox";

afterEach(cleanup);

describe("CategoryBox", () => {
  it("shows a message when a search has no results", () => {
    const category = new Category({
      id: SEARCH_RESULT_CATEGORY_ID,
      name: "Search Result",
      files: [],
    });

    render(
      <CodeModalContextProvider>
        <SnackbarContextProvider>
          <CategoryBox category={category} />
        </SnackbarContextProvider>
      </CodeModalContextProvider>,
    );

    expect(screen.getByRole("status").textContent).toBe(
      "No matching rules found.",
    );
  });

  it("keeps file actions outside the accordion summary and heading", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          json: {
            title: "Example",
            maintainers: ["example-maintainer"],
            rules: [
              {
                description: "New Rule",
                description_notes: ["First note", "Second note"],
              },
            ],
          },
        },
      ],
    });
    render(
      <CodeModalContextProvider>
        <SnackbarContextProvider>
          <CategoryBox category={category} />
        </SnackbarContextProvider>
      </CodeModalContextProvider>,
    );

    const summary = screen.getByRole("button", { name: "Example" });
    const importButton = screen.getByRole("button", { name: "Import" });
    const menuButton = screen.getByRole("button", { name: "Open import menu" });
    expect(summary.contains(importButton)).toBe(false);
    expect(summary.contains(menuButton)).toBe(false);
    expect(importButton.closest("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(menuButton.closest("h1, h2, h3, h4, h5, h6")).toBeNull();
    expect(
      summary.compareDocumentPosition(importButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);

    const visibleTitle = screen.getByText("Example", { selector: "span" });
    expect(visibleTitle.parentElement?.getAttribute("aria-hidden")).toBe(
      "true",
    );

    const maintainerLink = screen.getByRole("link", {
      name: "example-maintainer",
    });
    maintainerLink.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(maintainerLink);
    expect(summary.getAttribute("aria-expanded")).toBe("false");

    fireEvent.click(summary);
    const regionId = summary.getAttribute("aria-controls");
    const region = regionId === null ? null : document.getElementById(regionId);
    expect(region).not.toBeNull();
    expect(region?.getAttribute("aria-labelledby")).toBe(summary.id);
    expect(screen.getByText("First note").tagName).toBe("SPAN");
    expect(screen.getByText("Second note").tagName).toBe("SPAN");
  });
});
