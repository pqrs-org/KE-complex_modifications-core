import { Link } from "@mui/material";
import type { ReactNode } from "react";

const urlStartPattern = /https?:\/\/|github\.com\//giu;
const invalidUrlCharacterPattern = /[\s<>"`]/u;
const invalidUrlStartPreviousCharacterPattern = /[A-Za-z0-9_@./-]/u;
const bareGithubPrefix = "github.com/";

type LinkPart = {
  readonly start: number;
  readonly end: number;
  readonly href: string;
  readonly label: string;
};

const findUrlEnd = (text: string, start: number): number => {
  let openParentheses = 0;

  for (let index = start; index < text.length; index += 1) {
    const character = text[index];

    if (invalidUrlCharacterPattern.test(character)) return index;

    if (character === "(") {
      openParentheses += 1;
    } else if (character === ")") {
      if (openParentheses === 0) return index;
      openParentheses -= 1;
    }
  }

  return text.length;
};

const githubProfileLabel = (url: URL): string | undefined => {
  if (url.hostname.toLowerCase() !== "github.com") return undefined;

  const pathSegments = url.pathname.split("/").filter(Boolean);
  if (pathSegments.length !== 1) return undefined;

  try {
    return `@${decodeURIComponent(pathSegments[0])}`;
  } catch {
    return `@${pathSegments[0]}`;
  }
};

const findLinks = (text: string): readonly LinkPart[] => {
  const links: LinkPart[] = [];

  for (const match of text.matchAll(urlStartPattern)) {
    const start = match.index;
    const matchedPrefix = match[0];
    const isBareGithub = matchedPrefix.toLowerCase() === bareGithubPrefix;
    const previousCharacter = text[start - 1];

    // Avoid recognizing a URL-like suffix inside an ASCII word, email address,
    // hostname, or another URL. Non-ASCII text is allowed immediately before
    // an URL so common forms such as "詳細はhttps://..." remain linkable.
    if (
      previousCharacter !== undefined &&
      invalidUrlStartPreviousCharacterPattern.test(previousCharacter)
    ) {
      continue;
    }

    const end = findUrlEnd(text, start);
    const source = text.slice(start, end);
    const href = isBareGithub ? `https://${source}` : source;

    try {
      const url = new URL(href);
      if (url.protocol !== "http:" && url.protocol !== "https:") continue;

      links.push({
        start,
        end,
        href,
        label: githubProfileLabel(url) ?? source,
      });
    } catch {
      // Leave malformed URL-like text untouched.
    }
  }

  return links;
};

export const LinkifiedText = ({
  children,
  overlaidByControl = false,
}: {
  children?: string;
  overlaidByControl?: boolean;
}) => {
  if (!children) return children;

  const links = findLinks(children);
  if (links.length === 0) {
    return overlaidByControl ? (
      <span aria-hidden="true">{children}</span>
    ) : (
      children
    );
  }

  const result: ReactNode[] = [];
  let offset = 0;
  const pushText = (start: number, end: number) => {
    const text = children.slice(start, end);
    result.push(
      overlaidByControl ? (
        <span aria-hidden="true" key={`text-${start}`}>
          {text}
        </span>
      ) : (
        text
      ),
    );
  };

  links.forEach((link) => {
    if (link.start < offset) return;

    if (link.start > offset) pushText(offset, link.start);
    result.push(
      <Link
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        sx={
          overlaidByControl
            ? { position: "relative", zIndex: 2, pointerEvents: "auto" }
            : undefined
        }
        key={`${link.start}-${link.href}`}
      >
        {link.label}
      </Link>,
    );
    offset = link.end;
  });

  if (offset < children.length) pushText(offset, children.length);

  return result;
};
