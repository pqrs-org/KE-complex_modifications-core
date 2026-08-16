// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { JsonModalContextProvider, useJsonModal } from ".";

const wrapper = ({ children }: { children: ReactNode }) => (
  <JsonModalContextProvider>{children}</JsonModalContextProvider>
);

const renderJsonModalHook = () => renderHook(() => useJsonModal(), { wrapper });

const jsonResponse = (json: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Internal Server Error",
    json: vi.fn().mockResolvedValue(json),
  }) as unknown as Response;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("JsonModalContextProvider", () => {
  it("loads and formats JSON before opening the modal", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ key: 1 })));
    const { result } = renderJsonModalHook();

    await act(() => result.current.openModal("Example", "example.json"));

    expect(result.current.open).toBe(true);
    expect(result.current.fetching).toBe(false);
    expect(result.current.title).toBe("Example");
    expect(result.current.jsonString).toBe('{ "key": 1 }');
  });

  it("shows an error when the response is not successful", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false)));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const { result } = renderJsonModalHook();

    await act(() => result.current.openModal("Broken", "broken.json"));

    expect(result.current.open).toBe(true);
    expect(result.current.fetching).toBe(false);
    expect(result.current.jsonString).toBe(
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
    const { result } = renderJsonModalHook();

    await act(async () => {
      const firstRequest = result.current.openModal("First", "first.json");
      const latestRequest = result.current.openModal("Latest", "latest.json");
      await Promise.all([firstRequest, latestRequest]);
    });

    expect(result.current.jsonString).toBe('{ "request": "latest" }');
    expect(result.current.title).toBe("Latest");
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
    const { result, unmount } = renderJsonModalHook();

    let request: Promise<void> | undefined;
    act(() => {
      request = result.current.openModal("Example", "example.json");
    });
    unmount();
    await request;

    expect(requestSignal?.aborted).toBe(true);
  });
});
