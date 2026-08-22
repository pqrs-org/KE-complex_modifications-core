// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCodeModal } from "../contexts";
import { CodeModal } from "./CodeModal";

vi.mock("../contexts", () => ({ useCodeModal: vi.fn() }));
vi.mock("./CodeSyntaxHighlighter", () => ({
  default: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

const setOpen = vi.fn();
const mockCodeModal = (overrides = {}) => {
  vi.mocked(useCodeModal).mockReturnValue({
    open: false,
    title: "",
    fetching: false,
    source: "",
    language: "json",
    setOpen,
    openModal: vi.fn(),
    ...overrides,
  });
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CodeModal", () => {
  it("shows a progress indicator while code is being fetched", () => {
    mockCodeModal({ fetching: true });

    render(<CodeModal />);

    const progressbar = screen.getByRole("progressbar", { hidden: true });
    expect(progressbar.parentElement?.style.visibility).not.toBe("hidden");
  });

  it("shows the title and JSON and closes from the close button", async () => {
    mockCodeModal({
      open: true,
      title: "Example",
      source: '{\n  "key": 1\n}',
    });

    render(<CodeModal />);

    expect(screen.getByRole("heading", { name: "Example" })).not.toBeNull();
    const json = await screen.findByText(/"key": 1/);
    expect(json.textContent).toBe('{\n  "key": 1\n}');

    fireEvent.click(screen.getByRole("button", { name: "Close code viewer" }));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
