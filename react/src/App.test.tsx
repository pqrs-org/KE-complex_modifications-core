// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  JsonModalContextProvider,
  SearchQueryContextProvider,
  SnackbarContextProvider,
} from "./contexts";

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
    json: vi.fn().mockResolvedValue(json),
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
  it("renders categories from dist.json", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response({
          index: [{ id: "category", name: "Category", files: [] }],
          example: [],
          revision: "revision",
          updatedAt: 1_700_000_000,
        }),
      ),
    );

    renderApp();

    expect((await screen.findAllByText("Category")).length).toBeGreaterThan(0);
    expect(screen.getByText(/revision: revision/)).not.toBeNull();
  });

  it("shows an error for an invalid dist.json structure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({})));
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    renderApp();

    expect(
      await screen.findByText("Failed to load rules. Please reload the page."),
    ).not.toBeNull();
  });

  it("filters files using the search query", async () => {
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
                  path: "json/matching.json",
                  json: { title: "Needle rule", rules: [] },
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
      await screen.findByRole("button", { name: "Needle rule" }),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "Unrelated rule" })).toBeNull();
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
      screen.queryByRole("menuitem", { name: "Open rule in new tab" }),
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
