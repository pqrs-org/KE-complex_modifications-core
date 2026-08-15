// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JsonModalContextProvider, SnackbarContextProvider } from "../contexts";
import { KarabinerJsonFile } from "../models";
import { ImportButton } from "./ImportButton";

const renderImportButton = () =>
  render(
    <JsonModalContextProvider>
      <SnackbarContextProvider>
        <ImportButton
          jsonFile={
            new KarabinerJsonFile({
              path: "json/example.json",
              json: { title: "Example" },
            })
          }
        />
      </SnackbarContextProvider>
    </JsonModalContextProvider>,
  );

afterEach(cleanup);

describe("ImportButton", () => {
  it("moves focus into the menu and restores it when closed", async () => {
    renderImportButton();
    const menuButton = screen.getByRole("button", { name: "Open import menu" });

    fireEvent.click(menuButton);
    const menu = await screen.findByRole("menu");
    const firstItem = within(menu).getByRole("menuitem", {
      name: "Import to Karabiner-Elements",
    });
    await waitFor(() => expect(document.activeElement).toBe(firstItem));

    fireEvent.keyDown(menu, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(menuButton));
  });
});
