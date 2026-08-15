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

export const decodeLocationHash = (hash: string): string => {
  const value = hash.startsWith("#") ? hash.slice(1) : hash;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};
