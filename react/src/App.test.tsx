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
  LocationHashContextProvider,
  SearchQueryContextProvider,
  SnackbarContextProvider,
} from "./contexts";

const renderApp = () =>
  render(
    <JsonModalContextProvider>
      <LocationHashContextProvider>
        <SearchQueryContextProvider>
          <SnackbarContextProvider>
            <App />
          </SnackbarContextProvider>
        </SearchQueryContextProvider>
      </LocationHashContextProvider>
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

    expect(
      await screen.findByRole("button", { name: "Second rule" }),
    ).not.toBeNull();
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

    expect(
      await screen.findByRole("button", { name: "Second rule" }),
    ).not.toBeNull();
    expect(screen.queryByRole("button", { name: "First rule" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Search rules" })).toBeNull();
    expect(screen.getByRole("link", { name: "Show all rules" })).not.toBeNull();
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
        ?.getAttribute("data-highlighted"),
    ).toBe("true");
    expect(
      document
        .getElementById("Other category")
        ?.getAttribute("data-highlighted"),
    ).toBe("false");

    fireEvent.click(screen.getByRole("link", { name: "Other category" }));

    expect(
      document
        .getElementById("Examples: Others")
        ?.getAttribute("data-highlighted"),
    ).toBe("false");
    expect(
      document
        .getElementById("Other category")
        ?.getAttribute("data-highlighted"),
    ).toBe("true");
  });
});
