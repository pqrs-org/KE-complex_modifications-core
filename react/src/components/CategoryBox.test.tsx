// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  JsonModalContextProvider,
  LocationHashContextProvider,
  SnackbarContextProvider,
} from "../contexts";
import { Category } from "../models";
import { CategoryBox } from "./CategoryBox";

afterEach(cleanup);

describe("CategoryBox", () => {
  it("keeps file actions outside the accordion summary", () => {
    const category = new Category({
      id: "category",
      name: "Category",
      files: [
        {
          path: "json/example.json",
          json: { title: "Example", rules: [] },
        },
      ],
    });
    render(
      <JsonModalContextProvider>
        <LocationHashContextProvider>
          <SnackbarContextProvider>
            <CategoryBox category={category} />
          </SnackbarContextProvider>
        </LocationHashContextProvider>
      </JsonModalContextProvider>,
    );

    const summary = screen.getByRole("button", { name: "Example" });
    const importButton = screen.getByRole("button", { name: "Import" });
    const menuButton = screen.getByRole("button", { name: "Open import menu" });
    expect(summary.contains(importButton)).toBe(false);
    expect(summary.contains(menuButton)).toBe(false);
  });
});
