// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KarabinerJsonFile } from "../models";
import { ImportButton } from "./ImportButton";

const contextMocks = vi.hoisted(() => ({
  openModal: vi.fn(),
  setSnackbarText: vi.fn(),
}));

vi.mock("../contexts", () => ({
  useJsonModal: () => ({ openModal: contextMocks.openModal }),
  useSnackbar: () => ({ setText: contextMocks.setSnackbarText }),
}));

const originalClipboard = navigator.clipboard;

const setClipboard = (clipboard: unknown) => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: clipboard,
  });
};

const renderImportButton = () =>
  render(
    <>
      <button>Before import controls</button>
      <ImportButton
        jsonFile={
          new KarabinerJsonFile({
            path: "json/example.json",
            json: { title: "Example" },
          })
        }
      />
      <button>After import controls</button>
    </>,
  );

const openMenu = async () => {
  fireEvent.click(screen.getByRole("button", { name: "Open import menu" }));
  return screen.findByRole("menu");
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  setClipboard(originalClipboard);
});

describe("ImportButton", () => {
  it("moves focus into the menu and restores it when closed", async () => {
    renderImportButton();
    const menuButton = screen.getByRole("button", { name: "Open import menu" });

    const menu = await openMenu();
    const firstItem = within(menu).getByRole("menuitem", {
      name: "Import to Karabiner-Elements",
    });
    await waitFor(() => expect(document.activeElement).toBe(firstItem));

    fireEvent.keyDown(menu, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(menuButton));
  });

  it.each([
    [false, "After import controls"],
    [true, "Import"],
  ])(
    "closes the menu and moves focus when Tab is pressed (shift: %s)",
    async (shiftKey, expectedButtonName) => {
      renderImportButton();
      const menu = await openMenu();

      fireEvent.keyDown(menu, { key: "Tab", shiftKey });

      await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
      await waitFor(() =>
        expect(document.activeElement).toBe(
          screen.getByRole("button", { name: expectedButtonName }),
        ),
      );
    },
  );

  it("opens the selected JSON in the modal", async () => {
    renderImportButton();
    const menu = await openMenu();

    fireEvent.click(within(menu).getByRole("menuitem", { name: "Show JSON" }));

    expect(contextMocks.openModal).toHaveBeenCalledWith(
      "Example",
      "json/example.json",
    );
  });

  it.each([
    ["Copy URL", "?rule=json%2Fexample.json"],
    ["Copy JSON URL", "json/example.json"],
  ])("copies the URL from %s", async (menuItemName, url) => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderImportButton();
    const menu = await openMenu();

    fireEvent.click(within(menu).getByRole("menuitem", { name: menuItemName }));

    const absoluteUrl = new URL(url, document.baseURI).href;
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(absoluteUrl));
    expect(contextMocks.setSnackbarText).toHaveBeenCalledWith(
      `You just copied: ${absoluteUrl}`,
    );
  });

  it("shows an error when the clipboard API is unavailable", async () => {
    setClipboard(undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderImportButton();
    const menu = await openMenu();

    fireEvent.click(within(menu).getByRole("menuitem", { name: "Copy URL" }));

    await waitFor(() =>
      expect(contextMocks.setSnackbarText).toHaveBeenCalledWith(
        expect.stringMatching(/^ERROR: Failed to copy:/),
      ),
    );
  });

  it("opens the fetched JSON in the external editor", async () => {
    const replace = vi.fn();
    const editorWindow = {
      opener: {},
      location: { replace },
      close: vi.fn(),
    };
    vi.spyOn(window, "open").mockReturnValue(editorWindow as unknown as Window);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ title: "Example" }),
      }),
    );
    renderImportButton();
    const menu = await openMenu();

    fireEvent.click(
      within(menu).getByRole("menuitem", {
        name: "Edit JSON (Open external site)",
      }),
    );

    await waitFor(() =>
      expect(replace).toHaveBeenCalledWith(
        expect.stringMatching(
          /^https:\/\/genesy\.github\.io\/karabiner-complex-rules-generator\/#/,
        ),
      ),
    );
    expect(editorWindow.opener).toBeNull();
  });

  it("closes the editor window when fetching JSON fails", async () => {
    const close = vi.fn();
    vi.spyOn(window, "open").mockReturnValue({
      opener: null,
      location: { replace: vi.fn() },
      close,
    } as unknown as Window);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      }),
    );
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderImportButton();
    const menu = await openMenu();

    fireEvent.click(
      within(menu).getByRole("menuitem", {
        name: "Edit JSON (Open external site)",
      }),
    );

    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(contextMocks.setSnackbarText).toHaveBeenCalledWith(
      "ERROR: Failed to open editor",
    );
  });

  it("shows an error when the editor window is blocked", async () => {
    vi.spyOn(window, "open").mockReturnValue(null);
    renderImportButton();
    const menu = await openMenu();

    fireEvent.click(
      within(menu).getByRole("menuitem", {
        name: "Edit JSON (Open external site)",
      }),
    );

    expect(contextMocks.setSnackbarText).toHaveBeenCalledWith(
      "ERROR: The editor window was blocked",
    );
  });
});
