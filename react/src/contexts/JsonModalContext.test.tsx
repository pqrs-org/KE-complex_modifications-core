// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JsonModalContextProvider, useJsonModal } from ".";

const JsonModalProbe = () => {
  const jsonModal = useJsonModal();
  return (
    <>
      <output data-testid="open">{String(jsonModal.open)}</output>
      <output data-testid="fetching">{String(jsonModal.fetching)}</output>
      <output data-testid="title">{jsonModal.title}</output>
      <output data-testid="json">{jsonModal.jsonString}</output>
      <button
        onClick={() => void jsonModal.openModal("Example", "example.json")}
      >
        Load example
      </button>
      <button onClick={() => void jsonModal.openModal("Broken", "broken.json")}>
        Load broken
      </button>
      <button
        onClick={() => {
          void jsonModal.openModal("First", "first.json");
          void jsonModal.openModal("Latest", "latest.json");
        }}
      >
        Load competing requests
      </button>
    </>
  );
};

const renderJsonModal = () =>
  render(
    <JsonModalContextProvider>
      <JsonModalProbe />
    </JsonModalContextProvider>,
  );

const jsonResponse = (json: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Internal Server Error",
    json: vi.fn().mockResolvedValue(json),
  }) as unknown as Response;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("JsonModalContextProvider", () => {
  it("loads and formats JSON before opening the modal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ key: 1 })));
    renderJsonModal();

    fireEvent.click(screen.getByRole("button", { name: "Load example" }));

    await waitFor(() =>
      expect(screen.getByTestId("open").textContent).toBe("true"),
    );
    expect(screen.getByTestId("fetching").textContent).toBe("false");
    expect(screen.getByTestId("title").textContent).toBe("Example");
    expect(screen.getByTestId("json").textContent).toBe(
      JSON.stringify({ key: 1 }, null, 2),
    );
  });

  it("shows an error when the response is not successful", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false)));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderJsonModal();

    fireEvent.click(screen.getByRole("button", { name: "Load broken" }));

    await waitFor(() =>
      expect(screen.getByTestId("open").textContent).toBe("true"),
    );
    expect(screen.getByTestId("fetching").textContent).toBe("false");
    expect(screen.getByTestId("json").textContent).toBe(
      "ERROR: Failed to fetch: broken.json",
    );
  });

  it("keeps the latest result when a previous request is aborted", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        (_url: string, { signal }: { signal: AbortSignal }) =>
          new Promise<Response>((_resolve, reject) => {
            signal.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      )
      .mockResolvedValueOnce(jsonResponse({ request: "latest" }));
    vi.stubGlobal("fetch", fetchMock);
    renderJsonModal();

    fireEvent.click(
      screen.getByRole("button", { name: "Load competing requests" }),
    );

    await waitFor(() =>
      expect(screen.getByTestId("json").textContent).toBe(
        JSON.stringify({ request: "latest" }, null, 2),
      ),
    );
    expect(screen.getByTestId("title").textContent).toBe("Latest");
  });

  it("aborts an in-flight request when the provider is unmounted", async () => {
    let requestSignal: AbortSignal | undefined;
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockImplementation(
          (_url: string, { signal }: { signal: AbortSignal }) => {
            requestSignal = signal;
            return new Promise<Response>((_resolve, reject) => {
              signal.addEventListener("abort", () =>
                reject(new DOMException("Aborted", "AbortError")),
              );
            });
          },
        ),
    );
    const view = renderJsonModal();
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));

    view.unmount();
    await Promise.resolve();

    expect(requestSignal?.aborted).toBe(true);
  });
});
