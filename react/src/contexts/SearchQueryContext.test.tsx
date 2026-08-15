// @vitest-environment jsdom

import { act } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchQueryContextProvider, useSearchQuery } from ".";

const SearchQueryProbe = () => {
  const { query } = useSearchQuery();
  return <output data-testid="query">{query}</output>;
};

const renderSearchQuery = () =>
  render(
    <SearchQueryContextProvider>
      <SearchQueryProbe />
    </SearchQueryContextProvider>,
  );

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("SearchQueryContextProvider", () => {
  it("reads the initial search query", () => {
    window.history.replaceState(null, "", "/?q=initial%20query");

    renderSearchQuery();

    expect(screen.getByTestId("query").textContent).toBe("initial query");
  });

  it("updates the search query when browser history changes", () => {
    renderSearchQuery();

    act(() => {
      window.history.pushState(null, "", "/?q=next");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByTestId("query").textContent).toBe("next");
  });
});
