// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  JsonModalContextProvider,
  SearchQueryContextProvider,
  SnackbarContextProvider,
} from "./contexts";
import { SEARCH_RESULT_CATEGORY_ID } from "./models";

const renderApp = () =>
  render(
    <JsonModalContextProvider>
      <SearchQueryContextProvider>
        <SnackbarContextProvider>
          <App />
        </SnackbarContextProvider>
      </SearchQueryContextProvider>
    </JsonModalContextProvider>,
  );

const response = (json: unknown) =>
  ({
    ok: true,
    json: vi
      .fn()
      .mockResolvedValue(
        typeof json === "object" && json !== null && !Array.isArray(json)
          ? { search_suggestions: [], ...json }
          : json,
      ),
  }) as unknown as Response;

const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "scrollIntoView",
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  if (scrollIntoViewDescriptor) {
    Object.defineProperty(
      HTMLElement.prototype,
      "scrollIntoView",
      scrollIntoViewDescriptor,
    );
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  }
  window.history.replaceState(null, "", "/");
});

describe("App", () => {
  it("shows the dist.json loading indicator in the content area", () => {
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    renderApp();

    expect(
      screen.getByRole("status", { name: "Loading rules" }),
    ).not.toBeNull();
    expect(screen.getByText("Loading rules...")).not.toBeNull();
    expect(
      within(screen.getByRole("banner")).queryByRole("progressbar"),
    ).toBeNull();
  });

  it("shows shared-rule loading progress in the content alert", () => {
    window.history.replaceState(null, "", "/?rule=json%2Fexample.json");
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));

    renderApp();

    expect(
      within(screen.getByRole("alert")).getByRole("progressbar"),
    ).not.toBeNull();
    expect(
      within(screen.getByRole("banner")).queryByRole("progressbar"),
    ).toBeNull();
  });

  it("fits the table of contents into the visible viewport", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);
    const getBoundingClientRect = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockReturnValue({ top: 120 } as DOMRect);

    renderApp();

    const tableOfContents = await screen.findByRole("navigation", {
      name: "Table of contents",
    });
    await waitFor(() => {
      expect(
        tableOfContents.style.getPropertyValue("--toc-available-height"),
      ).toBe("680px");
    });

    getBoundingClientRect.mockReturnValue({ top: 0 } as DOMRect);
    fireEvent.scroll(window);
    await waitFor(() => {
      expect(
        tableOfContents.style.getPropertyValue("--toc-available-height"),
      ).toBe("800px");
    });
  });

  it("renders categories from dist.json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [{ id: "category", name: "Category", files: [] }],
          example: [],
          search_suggestions: ["Mouse"],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect((await screen.findAllByText("Category")).length).toBeGreaterThan(0);
    expect(
      screen.getByRole("button", { name: "Search for Mouse (0 results)" }),
    ).not.toBeNull();
    expect(screen.getByText(/revision: revision/)).not.toBeNull();
  });

  it("uses the metadata ranking within regular categories", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/plain.json",
                  json: { title: "Plain regular priority", rules: [] },
                },
                {
                  path: "json/short-documented.json",
                  extra_description_path: "extra_descriptions/short.html",
                  extra_description_text: "Short.",
                  json: {
                    title: "Short documented regular priority",
                    rules: [],
                  },
                },
                {
                  path: "json/long-documented.json",
                  extra_description_path: "extra_descriptions/long.html",
                  extra_description_text: "Detailed documentation.",
                  json: {
                    title: "Long documented regular priority",
                    rules: [],
                  },
                },
                {
                  path: "json/maintained.json",
                  json: {
                    title: "Maintained regular priority",
                    maintainers: ["maintainer"],
                    rules: [],
                  },
                },
                {
                  path: "json/both.json",
                  extra_description_path: "extra_descriptions/both.html",
                  extra_description_text: "Description.",
                  json: {
                    title: "Both regular priority",
                    author: "author",
                    rules: [],
                  },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect(
      (
        await screen.findAllByRole("button", { name: / regular priority$/ })
      ).map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Both regular priority",
      "Maintained regular priority",
      "Long documented regular priority",
      "Short documented regular priority",
      "Plain regular priority",
    ]);
  });

  it("shows an error for an invalid dist.json structure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({})));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderApp();

    expect(
      await screen.findByText("Failed to load rules. Please reload the page."),
    ).not.toBeNull();
  });

  it.each([
    ["title", "needle", { title: "Needle rule", rules: [] }],
    [
      "rule description notes",
      "needle-note",
      {
        title: "Matching rule",
        rules: [
          {
            description: "Rule",
            description_notes: ["Contains needle-note"],
          },
        ],
      },
    ],
  ])("filters files using the %s", async (_source, query, matchingJson) => {
    window.history.replaceState(null, "", `/?q=${query}`);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/matching.json",
                  json: matchingJson,
                },
                {
                  path: "json/unrelated.json",
                  json: { title: "Unrelated rule", rules: [] },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect(
      await screen.findByRole("button", { name: matchingJson.title }),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Unrelated rule" })).toBeNull();
    expect(document.getElementById(SEARCH_RESULT_CATEGORY_ID)).toBeNull();
  });

  it("filters files by author", async () => {
    window.history.replaceState(null, "", "/?q=example-author");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/authored.json",
                  json: {
                    title: "Authored rule",
                    author: "example-author",
                    rules: [],
                  },
                },
                {
                  path: "json/unrelated.json",
                  json: { title: "Unrelated rule", rules: [] },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect(
      await screen.findByRole("button", { name: "Authored rule" }),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Unrelated rule" })).toBeNull();
  });

  it("prioritizes attribution, title matches, and documentation in search results", async () => {
    window.history.replaceState(null, "", "/?q=needle");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/plain.json",
                  json: {
                    title: "Needle plain priority",
                    maintainers: [],
                    rules: [],
                  },
                },
                {
                  path: "json/documented.json",
                  extra_description_path: "extra_descriptions/example.html",
                  extra_description_text: "",
                  json: {
                    title: "Documented priority",
                    rules: [{ description: "needle" }],
                  },
                },
                {
                  path: "json/maintained.json",
                  json: {
                    title: "Maintained priority",
                    maintainers: ["maintainer"],
                    rules: [{ description: "needle" }],
                  },
                },
                {
                  path: "json/authored.json",
                  json: {
                    title: "Authored priority",
                    author: "author",
                    rules: [{ description: "needle" }],
                  },
                },
                {
                  path: "json/both.json",
                  extra_description_path: "extra_descriptions/example.html",
                  extra_description_text: "",
                  json: {
                    title: "Both priority",
                    author: "author",
                    rules: [{ description: "needle" }],
                  },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    const names = (
      await screen.findAllByRole("button", { name: / priority$/ })
    ).map((button) => button.getAttribute("aria-label"));
    expect(names[0]).toBe("Both priority");
    expect(new Set(names.slice(1, 3))).toEqual(
      new Set(["Maintained priority", "Authored priority"]),
    );
    expect(names[3]).toBe("Needle plain priority");
    expect(names[4]).toBe("Documented priority");
  });

  it("prioritizes fuzzy title matches over extra description length", async () => {
    window.history.replaceState(null, "", "/?q=needlf");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/short.json",
                  extra_description_path: "extra_descriptions/short.html",
                  extra_description_text: "Short.",
                  json: {
                    title: "Needle short description priority",
                    author: "author",
                    rules: [],
                  },
                },
                {
                  path: "json/long.json",
                  extra_description_path: "extra_descriptions/long.html",
                  extra_description_text: "Detailed documentation. ".repeat(
                    100,
                  ),
                  json: {
                    title: "Long description priority",
                    author: "author",
                    rules: [{ description: "needle" }],
                  },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect(
      (
        await screen.findAllByRole("button", {
          name: /description priority$/,
        })
      ).map((button) => button.getAttribute("aria-label")),
    ).toEqual([
      "Needle short description priority",
      "Long description priority",
    ]);
  });

  it("does not filter files using the location hash", async () => {
    window.history.replaceState(null, "", "/#second");
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/first.json",
                  json: { title: "First rule", rules: [] },
                },
                {
                  path: "json/second.json",
                  json: { title: "Second rule", rules: [] },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    const selectedRule = await screen.findByRole("button", {
      name: "Second rule",
    });
    expect(selectedRule.getAttribute("aria-expanded")).toBe("false");
    expect(screen.getByRole("button", { name: "First rule" })).not.toBeNull();
    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledOnce());
  });

  it("shows only the rule selected by a shared URL", async () => {
    window.history.replaceState(null, "", "/?rule=json%2Fsecond.json");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "category",
              name: "Category",
              files: [
                {
                  path: "json/first.json",
                  json: { title: "First rule", rules: [] },
                },
                {
                  path: "json/second.json",
                  json: {
                    title: "Second rule",
                    rules: [{ description: "Second rule description" }],
                  },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect(await screen.findByText("Second rule description")).not.toBeNull();
    expect(screen.getAllByText("Second rule")).toHaveLength(2);
    expect(screen.queryByRole("button", { name: "Second rule" })).toBeNull();
    expect(screen.queryByRole("button", { name: "First rule" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Search rules" })).toBeNull();
    expect(
      screen.queryByRole("navigation", { name: "Table of contents" }),
    ).toBeNull();
    expect(screen.queryByText("Category")).toBeNull();
    expect(screen.getByRole("link", { name: "Show all rules" })).not.toBeNull();
    expect(screen.getByRole("alert").textContent).toContain(
      "Showing only the rule specified by this URL: “Second rule”.",
    );

    fireEvent.click(screen.getByRole("button", { name: "Open import menu" }));
    expect(await screen.findByRole("menu")).not.toBeNull();
    expect(
      screen.queryByRole("menuitem", {
        name: "Open shareable rule page in new tab",
      }),
    ).toBeNull();
  });

  it("does not filter categories using a percent-encoded location hash", async () => {
    window.history.replaceState(null, "", "/?q=#Examples%3A%20Others");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [
            {
              id: "Examples: Others",
              name: "Examples: Others",
              files: [
                {
                  path: "json/example_halt.json",
                  json: { title: "Example rule", rules: [] },
                },
              ],
            },
            {
              id: "Other category",
              name: "Other category",
              files: [
                {
                  path: "json/other.json",
                  json: { title: "Other rule", rules: [] },
                },
              ],
            },
          ],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect(
      await screen.findByRole("button", { name: "Example rule" }),
    ).not.toBeNull();
    expect(screen.getByRole("button", { name: "Other rule" })).not.toBeNull();
    expect(
      document
        .getElementById("Examples: Others")
        ?.getAttribute("data-hash-highlighted"),
    ).toBe("true");
    expect(
      document
        .getElementById("Other category")
        ?.getAttribute("data-hash-highlighted"),
    ).toBeNull();

    const link = screen.getByRole("link", { name: "Other category" });
    link.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    fireEvent.click(link);

    expect(
      document
        .getElementById("Examples: Others")
        ?.getAttribute("data-hash-highlighted"),
    ).toBeNull();
    expect(
      document
        .getElementById("Other category")
        ?.getAttribute("data-hash-highlighted"),
    ).toBe("true");
  });
});
