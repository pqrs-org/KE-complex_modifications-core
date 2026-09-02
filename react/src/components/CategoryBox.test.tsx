// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeModalContextProvider, SnackbarContextProvider } from "../contexts";
import { Category, SEARCH_RESULT_CATEGORY_ID } from "../models";
import { CategoryBox } from "./CategoryBox";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
          metadata: {
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
    expect(visibleTitle.getAttribute("aria-hidden")).toBe("true");

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

  it("keeps rule headings sticky below the measured category heading", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          metadata: { title: "Example", rules: [] },
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

    const categoryHeading = screen.getByText("Category");
    vi.spyOn(categoryHeading, "getBoundingClientRect").mockReturnValue({
      height: 72,
    } as DOMRect);
    fireEvent(window, new Event("resize"));

    expect(
      categoryHeading.parentElement?.style.getPropertyValue(
        "--category-heading-height",
      ),
    ).toBe("72px");

    const summary = screen.getByRole("button", { name: "Example" });
    const accordionHeading = summary.closest(".MuiAccordion-heading");
    expect(accordionHeading?.getAttribute("style")).toContain(
      "position: sticky",
    );
    expect(accordionHeading?.getAttribute("style")).toContain(
      "top: var(--rule-heading-sticky-top)",
    );
  });

  it("returns to a sticky rule heading when closing it", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          metadata: {
            title: "Example",
            rules: [{ description: "Rule description" }],
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
    const accordion = summary.closest<HTMLElement>(".MuiAccordion-root");
    const accordionHeading = summary.closest<HTMLElement>(
      ".MuiAccordion-heading",
    );
    expect(accordion).not.toBeNull();
    expect(accordionHeading).not.toBeNull();

    const scrollIntoView = vi.fn();
    Object.defineProperty(accordion, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    vi.spyOn(accordion!, "getBoundingClientRect").mockReturnValue({
      top: -300,
    } as DOMRect);
    vi.spyOn(accordionHeading!, "getBoundingClientRect").mockReturnValue({
      top: 144,
    } as DOMRect);

    fireEvent.click(summary);
    fireEvent.click(summary);

    expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" });
  });

  it("does not scroll when closing a rule whose heading is already visible", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          metadata: { title: "Example", rules: [] },
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
    const accordion = summary.closest<HTMLElement>(".MuiAccordion-root")!;
    const accordionHeading = summary.closest<HTMLElement>(
      ".MuiAccordion-heading",
    )!;
    const scrollIntoView = vi.fn();
    Object.defineProperty(accordion, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    vi.spyOn(accordion, "getBoundingClientRect").mockReturnValue({
      top: 144,
    } as DOMRect);
    vi.spyOn(accordionHeading, "getBoundingClientRect").mockReturnValue({
      top: 146,
    } as DOMRect);

    fireEvent.click(summary);
    fireEvent.click(summary);

    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("links URLs in rule descriptions and notes", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          metadata: {
            title: "Example",
            rules: [
              {
                description: "Created by https://github.com/example",
                description_notes: ["(https://example.com/こんにちは note)"],
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

    fireEvent.click(screen.getByRole("button", { name: "Example" }));

    expect(
      screen.getByRole("link", { name: "@example" }).getAttribute("href"),
    ).toBe("https://github.com/example");
    expect(
      screen
        .getByRole("link", { name: "https://example.com/こんにちは" })
        .getAttribute("href"),
    ).toBe("https://example.com/こんにちは");
  });

  it("opens a title URL without expanding the rule", () => {
    const title = "Visit https://example.com/title for details";
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          metadata: { title, rules: [] },
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

    const summary = screen.getByRole("button", { name: title });
    const link = screen.getByRole("link", {
      name: "https://example.com/title",
    });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);

    expect(summary.getAttribute("aria-expanded")).toBe("false");
    expect(link.getAttribute("href")).toBe("https://example.com/title");
  });

  it("opens an author URL without expanding the rule", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          metadata: {
            title: "Example",
            author: "https://github.com/example-author",
            rules: [],
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
    const link = screen.getByRole("link", { name: "@example-author" });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);

    expect(summary.getAttribute("aria-expanded")).toBe("false");
    expect(link.getAttribute("href")).toBe("https://github.com/example-author");
  });
});
