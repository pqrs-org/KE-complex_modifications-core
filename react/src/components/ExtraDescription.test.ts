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
});
