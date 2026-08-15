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

export const toKarabinerImportUrl = (jsonUrl: string): string =>
  `karabiner://karabiner/assets/complex_modifications/import?url=${encodeURIComponent(toAbsoluteUrl(jsonUrl))}`;
