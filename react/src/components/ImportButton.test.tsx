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
import { KarabinerFile } from "../models";
import { toKarabinerImportUrl } from "../utils/url";
import { ImportButton } from "./ImportButton";

const contextMocks = vi.hoisted(() => ({
  openModal: vi.fn(),
  setSnackbarText: vi.fn(),
}));

vi.mock("../contexts", () => ({
  useCodeModal: () => ({
    openModal: contextMocks.openModal,
  }),
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
        file={
          new KarabinerFile({
            path: "json/example.json",
            metadata: { title: "Example" },
          })
        }
      />
      <button>After import controls</button>
    </>,
  );

const renderJavaScriptImportButton = () =>
  render(
    <ImportButton
      file={
        new KarabinerFile({
          path: "js/example.js",
          ruleset_json_path: "js/example.ruleset.json",
          metadata: {
            title: "Example JavaScript",
            rules: [{ description: "Converted rule" }],
          },
        })
      }
    />,
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
      name: "Open shareable rule page in new tab",
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

  it("opens the selected JavaScript in the modal", async () => {
    renderJavaScriptImportButton();
    const menu = await openMenu();

    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Show JavaScript" }),
    );

    expect(contextMocks.openModal).toHaveBeenCalledWith(
      "Example JavaScript",
      "js/example.js",
    );
    expect(
      within(menu).getByRole("menuitem", { name: "Copy JavaScript URL" }),
    ).not.toBeNull();
  });

  it("opens compatible JSON for a JavaScript file in the modal", async () => {
    renderJavaScriptImportButton();
    const menu = await openMenu();

    fireEvent.click(
      within(menu).getByRole("menuitem", { name: "Show compatible JSON" }),
    );

    expect(contextMocks.openModal).toHaveBeenCalledWith(
      "Example JavaScript",
      "js/example.ruleset.json",
    );
  });

  it("links to the ruleset JSON import for older versions", async () => {
    renderJavaScriptImportButton();
    const menu = await openMenu();

    const link = within(menu).getByRole("menuitem", {
      name: "Import JSON compatible with Karabiner-Elements 16.1.0 or earlier",
    });
    const javascriptLink = within(menu).getByRole("menuitem", {
      name: "Import JavaScript code",
    });
    const divider = within(menu).getByRole("separator");

    expect(javascriptLink.getAttribute("href")).toBe(
      toKarabinerImportUrl("js/example.js"),
    );
    expect(link.getAttribute("href")).toBe(
      toKarabinerImportUrl("js/example.ruleset.json"),
    );
    expect(within(menu).getAllByRole("menuitem")[0]).toBe(javascriptLink);
    expect(javascriptLink.nextElementSibling).toBe(link);
    expect(link.nextElementSibling).toBe(divider);
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

  it("copies the compatible JSON URL for a JavaScript file", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    renderJavaScriptImportButton();
    const menu = await openMenu();

    fireEvent.click(
      within(menu).getByRole("menuitem", {
        name: "Copy compatible JSON URL",
      }),
    );

    const absoluteUrl = new URL("js/example.ruleset.json", document.baseURI)
      .href;
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(absoluteUrl));
    expect(contextMocks.setSnackbarText).toHaveBeenCalledWith(
      `You just copied: ${absoluteUrl}`,
    );
  });

  it("links to the shared rule in a new tab", async () => {
    renderImportButton();
    const menu = await openMenu();

    const link = within(menu).getByRole("menuitem", {
      name: "Open shareable rule page in new tab",
    });

    expect(link.getAttribute("href")).toBe(
      new URL("?rule=json%2Fexample.json", document.baseURI).href,
    );
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noopener noreferrer");
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
});
