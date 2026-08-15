// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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

  it("filters files using the location hash", async () => {
    window.history.replaceState(null, "", "/#second");
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
  });
});
