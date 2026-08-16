// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SearchQueryContextProvider, useSearchQuery } from "../contexts";
import { SearchSuggestions } from "./SearchSuggestions";

const SearchProbe = () => {
  const { query } = useSearchQuery();
  return <output data-testid="query">{query}</output>;
};

const suggestions = ["Caps Lock", "Mouse", "Hyper Key"];
const counts = new Map(
  suggestions.map((suggestion, index) => [suggestion, index + 1]),
);

const renderSearchSuggestions = () =>
  render(
    <SearchQueryContextProvider>
      <SearchSuggestions suggestions={suggestions} counts={counts} />
      <SearchProbe />
    </SearchQueryContextProvider>,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("SearchSuggestions", () => {
  it("sorts suggestions by hit count", () => {
    renderSearchSuggestions();

    expect(
      screen.getAllByRole("button").map((button) => button.textContent),
    ).toEqual(["Hyper Key3", "Mouse2", "Caps Lock1"]);
  });

  it("searches for the selected suggestion", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderSearchSuggestions();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Search for Hyper Key (3 results)",
      }),
    );

    expect(screen.getByTestId("query").textContent).toBe("Hyper Key");
    expect(window.location.search).toBe("?q=Hyper%20Key");
    expect(
      screen
        .getByRole("button", {
          name: "Search for Hyper Key (3 results)",
        })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
  });
});
