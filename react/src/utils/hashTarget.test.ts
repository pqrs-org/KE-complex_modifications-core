// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import {
  clearHashTargetHighlight,
  highlightElementById,
  highlightLocationHashTarget,
} from "./hashTarget";

afterEach(() => {
  document.body.replaceChildren();
  window.history.replaceState(null, "", "/");
});

describe("hash target highlighting", () => {
  it("moves the highlight to the requested element", () => {
    const first = document.createElement("div");
    first.id = "first";
    first.dataset.hashHighlighted = "true";
    const second = document.createElement("div");
    second.id = "second";
    document.body.append(first, second);

    expect(highlightElementById("second")).toBe(second);
    expect(first.hasAttribute("data-hash-highlighted")).toBe(false);
    expect(second.dataset.hashHighlighted).toBe("true");
  });

  it("decodes and highlights the current location hash", () => {
    const target = document.createElement("div");
    target.id = "Examples: Others";
    document.body.append(target);
    window.history.replaceState(null, "", "/#Examples%3A%20Others");

    expect(highlightLocationHashTarget()).toBe(target);
    expect(target.dataset.hashHighlighted).toBe("true");
  });

  it("clears the current highlight", () => {
    const target = document.createElement("div");
    target.dataset.hashHighlighted = "true";
    document.body.append(target);

    clearHashTargetHighlight();

    expect(target.hasAttribute("data-hash-highlighted")).toBe(false);
  });
});
