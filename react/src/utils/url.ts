export const toAbsoluteUrl = (
  href: string,
  base = document.baseURI || location.href,
): string => {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
};
