// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JsonModalContextProvider, SnackbarContextProvider } from "../contexts";
import { Category } from "../models";
import { CategoryBox } from "./CategoryBox";

afterEach(cleanup);

describe("CategoryBox", () => {
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
            rules: [],
          },
        },
      ],
    });
    render(
      <JsonModalContextProvider>
        <SnackbarContextProvider>
          <CategoryBox category={category} />
        </SnackbarContextProvider>
      </JsonModalContextProvider>,
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
  });
});
