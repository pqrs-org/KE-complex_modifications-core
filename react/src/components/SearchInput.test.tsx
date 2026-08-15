// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  vi.restoreAllMocks();
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
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    renderSearchInput();
    const input = screen.getByRole("textbox", { name: "Search rules" });
    fireEvent.change(input, { target: { value: "example query" } });

    submit();

    expect(screen.getByTestId("query").textContent).toBe("example query");
    expect(window.location.search).toBe("?q=example%20query");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
  });

  it("removes the query parameter when the search is cleared", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.history.replaceState(null, "", "/?q=example#category");
    renderSearchInput();
    const input = screen.getByRole("textbox", { name: "Search rules" });
    fireEvent.change(input, { target: { value: "" } });

    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByTestId("query").textContent).toBe("");
    expect(window.location.href).toBe("http://localhost:3000/");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
  });

  it("clears the search using the clear button", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    window.history.replaceState(null, "", "/?q=example");
    renderSearchInput();

    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));

    expect(screen.getByRole<HTMLInputElement>("textbox").value).toBe("");
    expect(screen.getByTestId("query").textContent).toBe("");
    expect(window.location.href).toBe("http://localhost:3000/");
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
  });
});
