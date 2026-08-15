// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SearchQueryContextProvider, useSearchQuery } from "../contexts";
import { SearchInput } from "./SearchInput";

const SearchProbe = () => {
  const { query } = useSearchQuery();
  return <output data-testid="query">{query}</output>;
};

const renderSearchInput = () =>
  render(
    <SearchQueryContextProvider>
      <SearchInput />
      <SearchProbe />
    </SearchQueryContextProvider>,
  );

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

describe("SearchInput", () => {
  it.each([
    [
      "Enter",
      () => fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" }),
    ],
    ["blur", () => fireEvent.blur(screen.getByRole("textbox"))],
  ])("submits the query on %s", (_trigger, submit) => {
    renderSearchInput();
    const input = screen.getByRole("textbox", { name: "Search rules" });
    fireEvent.change(input, { target: { value: "example query" } });

    submit();

    expect(screen.getByTestId("query").textContent).toBe("example query");
    expect(window.location.search).toBe("?q=example%20query");
  });
});
