// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useJsonModal } from "../contexts";
import { JsonModal } from "./JsonModal";

vi.mock("../contexts", () => ({ useJsonModal: vi.fn() }));
vi.mock("./JsonSyntaxHighlighter", () => ({
  default: ({ children }: { children: string }) => <pre>{children}</pre>,
}));

const setOpen = vi.fn();
const mockJsonModal = (overrides = {}) => {
  vi.mocked(useJsonModal).mockReturnValue({
    open: false,
    title: "",
    fetching: false,
    jsonString: "",
    setOpen,
    openModal: vi.fn(),
    ...overrides,
  });
};

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("JsonModal", () => {
  it("shows a progress indicator while JSON is being fetched", () => {
    mockJsonModal({ fetching: true });

    render(<JsonModal />);

    const progressbar = screen.getByRole("progressbar", { hidden: true });
    expect(progressbar.parentElement?.style.visibility).not.toBe("hidden");
  });

  it("shows the title and JSON and closes from the close button", async () => {
    mockJsonModal({
      open: true,
      title: "Example",
      jsonString: '{\n  "key": 1\n}',
    });

    render(<JsonModal />);

    expect(screen.getByRole("heading", { name: "Example" })).not.toBeNull();
    const json = await screen.findByText(/"key": 1/);
    expect(json.textContent).toBe('{\n  "key": 1\n}');

    fireEvent.click(screen.getByRole("button", { name: "Close JSON viewer" }));
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
