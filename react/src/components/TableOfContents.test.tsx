// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocationHashContextProvider } from "../contexts";
import { Category } from "../models";
import { TableOfContents } from "./TableOfContents";

afterEach(cleanup);

describe("TableOfContents", () => {
  it("encodes category IDs in links", () => {
    render(
      <LocationHashContextProvider>
        <TableOfContents
          categories={[
            new Category({
              id: "Examples: Others",
              name: "Examples: Others",
              files: [],
            }),
          ]}
        />
      </LocationHashContextProvider>,
    );

    expect(
      screen
        .getByRole("link", { name: "Examples: Others" })
        .getAttribute("href"),
    ).toBe("./#Examples%3A%20Others");
  });
});
