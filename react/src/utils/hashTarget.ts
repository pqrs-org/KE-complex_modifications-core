import { decodeLocationHash } from "./url";

// Use a DOM attribute instead of CSS :target because the initial target is
// rendered asynchronously after dist.json loads. Updating the attribute
// directly also avoids re-rendering the full rule list during TOC navigation.
const highlightedSelector = '[data-hash-highlighted="true"]';

export const clearHashTargetHighlight = () => {
  document
    .querySelector(highlightedSelector)
    ?.removeAttribute("data-hash-highlighted");
};

export const highlightElementById = (id: string): HTMLElement | null => {
  clearHashTargetHighlight();

  const target = document.getElementById(id);
  target?.setAttribute("data-hash-highlighted", "true");
  return target;
};

export const highlightLocationHashTarget = (
  hash = window.location.hash,
): HTMLElement | null => highlightElementById(decodeLocationHash(hash));
