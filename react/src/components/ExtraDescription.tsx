import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { toAbsoluteUrl } from "../utils/url";

type Props = {
  src: string;
};

/**
 * Removes elements and attributes that can execute code from an extra
 * description. Regular markup and styles are intentionally preserved because
 * the content is rendered inside a shadow root. This is a defense-in-depth
 * measure for trusted content, not a general-purpose HTML sanitizer.
 */
export const removeExecutableContent = (root: HTMLElement) => {
  root
    .querySelectorAll("script, iframe, object, embed")
    .forEach((element) => element.remove());

  root.querySelectorAll<HTMLElement>("*").forEach((element) => {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();

      if (name.startsWith("on") || name === "srcdoc") {
        element.removeAttribute(attribute.name);
      } else if (
        ["href", "src", "xlink:href", "action", "formaction"].includes(name) &&
        /^javascript:/i.test(value)
      ) {
        element.removeAttribute(attribute.name);
      }
    }
  });
};

export const ExtraDescription = ({ src }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    const container = ref.current;
    if (container === null) return;

    const controller = new AbortController();
    const shadow =
      container.shadowRoot ?? container.attachShadow({ mode: "open" });
    shadow.replaceChildren();
    setErr(null);

    (async () => {
      try {
        const res = await fetch(src, {
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!res.ok)
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const html = await res.text();
        if (controller.signal.aborted) return;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;
        removeExecutableContent(wrapper);

        //
        // Adjust relative URLs
        //

        const base = toAbsoluteUrl(src);
        wrapper.querySelectorAll<HTMLElement>("[src]").forEach((el) => {
          const v = (el as HTMLImageElement).getAttribute("src");
          const a = toAbsoluteUrl(v ?? "", base);
          if (a && a !== v) (el as HTMLImageElement).setAttribute("src", a);
        });
        wrapper
          .querySelectorAll<HTMLAnchorElement>("a[href], link[href]")
          .forEach((el) => {
            const v = el.getAttribute("href");
            const a = toAbsoluteUrl(v ?? "", base);
            if (a && a !== v) el.setAttribute("href", a);
          });

        //
        // Inject bootstrap CSS
        //

        wrapper.dataset.bsTheme = "light";

        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", "vendor/bootstrap.min.css");
        shadow.replaceChildren(link, wrapper);
      } catch (e) {
        if (!controller.signal.aborted) setErr(e);
      }
    })();
    return () => {
      controller.abort();
      shadow.replaceChildren();
    };
  }, [src]);

  if (err) {
    return <Box role="alert">Failed to load {src}</Box>;
  }
  return <Box ref={ref} />;
};
