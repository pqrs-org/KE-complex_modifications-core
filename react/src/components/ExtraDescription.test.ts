// @vitest-environment jsdom

import { createElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExtraDescription, removeExecutableContent } from "./ExtraDescription";

const createRoot = (html: string) => {
  const root = document.createElement("div");
  root.innerHTML = html;
  return root;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("removeExecutableContent", () => {
  it("removes elements that can embed or execute code", () => {
    const root = createRoot(`
      <script>alert("script")</script>
      <iframe src="example.html"></iframe>
      <object data="example.html"></object>
      <embed src="example.html">
      <p>Safe content</p>
    `);

    removeExecutableContent(root);

    expect(root.querySelector("script, iframe, object, embed")).toBeNull();
    expect(root.querySelector("p")?.textContent).toBe("Safe content");
  });

  it("removes executable attributes", () => {
    const root = createRoot(`
      <button onclick="alert('click')">Button</button>
      <div srcdoc="<script>alert('srcdoc')</script>"></div>
      <a href=" javascript:alert('link')">Link</a>
      <a id="line-break" href="java&#10;script:alert('line-break')">Link</a>
      <img src="JAVASCRIPT:alert('image')" onerror="alert('error')">
      <form action="javascript:alert('form')"></form>
      <button formaction="javascript:alert('formaction')">Submit</button>
    `);

    removeExecutableContent(root);

    expect(root.querySelector("[onclick], [onerror], [srcdoc]")).toBeNull();
    expect(root.querySelector("a")?.hasAttribute("href")).toBe(false);
    expect(root.querySelector("#line-break")?.hasAttribute("href")).toBe(false);
    expect(root.querySelector("img")?.hasAttribute("src")).toBe(false);
    expect(root.querySelector("form")?.hasAttribute("action")).toBe(false);
    expect(root.querySelector("button[formaction]")).toBeNull();
  });

  it("preserves regular markup, styles, and safe URLs", () => {
    const root = createRoot(`
      <style>.description { color: green; }</style>
      <section class="description" data-kind="example">
        <a href="https://example.com/docs">Documentation</a>
        <img src="images/example.png" alt="Example">
      </section>
    `);

    removeExecutableContent(root);

    expect(root.querySelector("style")?.textContent).toContain("color: green");
    expect(root.querySelector("section")?.getAttribute("data-kind")).toBe(
      "example",
    );
    expect(root.querySelector("a")?.getAttribute("href")).toBe(
      "https://example.com/docs",
    );
    expect(root.querySelector("img")?.getAttribute("src")).toBe(
      "images/example.png",
    );
  });
});

describe("ExtraDescription", () => {
  it("uses a subtle style for keyboard keys", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue("<kbd>command</kbd>"),
      }),
    );

    const view = render(
      createElement(ExtraDescription, { src: "description.html" }),
    );
    const shadowHost = view.container.firstElementChild as HTMLElement;

    await waitFor(() =>
      expect(shadowHost.shadowRoot?.querySelector("kbd")).not.toBeNull(),
    );
    expect(
      shadowHost.shadowRoot?.querySelector("style")?.textContent,
    ).toContain("background-color: rgba(0, 0, 0, 0.06)");
  });

  it("resolves relative image and link URLs against the description URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi
          .fn()
          .mockResolvedValue(
            '<a href="docs/readme.html">Docs</a><img src="../images/example.png">',
          ),
      }),
    );

    const view = render(
      createElement(ExtraDescription, {
        src: "https://example.com/extra/descriptions/example.html",
      }),
    );
    const shadowHost = view.container.firstElementChild as HTMLElement;

    await waitFor(() =>
      expect(shadowHost.shadowRoot?.querySelector("a")).not.toBeNull(),
    );
    expect(
      shadowHost.shadowRoot?.querySelector("a")?.getAttribute("href"),
    ).toBe("https://example.com/extra/descriptions/docs/readme.html");
    expect(
      shadowHost.shadowRoot?.querySelector("img")?.getAttribute("src"),
    ).toBe("https://example.com/extra/images/example.png");
  });

  it("retries with a new source after a fetch error", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockRejectedValueOnce(new Error("Fetch failed"))
        .mockResolvedValueOnce({
          ok: true,
          text: vi.fn().mockResolvedValue("<p>Loaded description</p>"),
        }),
    );

    const view = render(
      createElement(ExtraDescription, { src: "failed-description.html" }),
    );
    const shadowHost = view.container.firstElementChild as HTMLElement;
    await screen.findByRole("alert");

    view.rerender(
      createElement(ExtraDescription, { src: "loaded-description.html" }),
    );

    await waitFor(() =>
      expect(shadowHost.shadowRoot?.textContent).toContain(
        "Loaded description",
      ),
    );
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("reuses a loaded description after reopening", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("<p>Cached description</p>"),
    });
    vi.stubGlobal("fetch", fetchMock);
    const props = { src: "cached-description.html" };
    const first = render(createElement(ExtraDescription, props));
    const firstHost = first.container.firstElementChild as HTMLElement;
    await waitFor(() =>
      expect(firstHost.shadowRoot?.textContent).toContain("Cached description"),
    );
    first.unmount();

    const second = render(createElement(ExtraDescription, props));
    const secondHost = second.container.firstElementChild as HTMLElement;
    await waitFor(() =>
      expect(secondHost.shadowRoot?.textContent).toContain(
        "Cached description",
      ),
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
    for (const host of [firstHost, secondHost]) {
      expect(
        host.shadowRoot?.querySelector('link[rel="stylesheet"]'),
      ).toBeNull();
    }
    expect(
      secondHost.shadowRoot?.querySelector("style")?.textContent,
    ).toContain("--bs-blue:");
  });

  it("shares an in-flight request across unmounts and concurrent views", async () => {
    let resolveText!: (html: string) => void;
    const text = new Promise<string>((resolve) => {
      resolveText = resolve;
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => text });
    vi.stubGlobal("fetch", fetchMock);
    const props = { src: "pending-description.html" };
    const first = render(createElement(ExtraDescription, props));
    const firstHost = first.container.firstElementChild as HTMLElement;
    first.unmount();
    const second = render(createElement(ExtraDescription, props));
    const third = render(createElement(ExtraDescription, props));
    resolveText("<p>Shared description</p>");

    for (const view of [second, third]) {
      const host = view.container.firstElementChild as HTMLElement;
      await waitFor(() =>
        expect(host.shadowRoot?.textContent).toContain("Shared description"),
      );
    }
    expect(firstHost.shadowRoot?.textContent).toBe("");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries the same URL after an unsuccessful response", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: "Unavailable",
      })
      .mockResolvedValueOnce({
        ok: true,
        text: vi.fn().mockResolvedValue("<p>Retry succeeded</p>"),
      });
    vi.stubGlobal("fetch", fetchMock);
    const props = { src: "retry-description.html" };
    const first = render(createElement(ExtraDescription, props));
    await screen.findByRole("alert");
    first.unmount();

    const second = render(createElement(ExtraDescription, props));
    const host = second.container.firstElementChild as HTMLElement;
    await waitFor(() =>
      expect(host.shadowRoot?.textContent).toContain("Retry succeeded"),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
