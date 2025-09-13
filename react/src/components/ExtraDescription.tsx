import { useEffect, useRef, useState } from "react";
import { toAbsoluteUrl } from "../utils/url";

type Props = {
  src: string;
};

export const ExtraDescription = ({ src }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const shadow =
          ref.current!.shadowRoot ??
          ref.current!.attachShadow({ mode: "open" });

        const res = await fetch(src, { credentials: "same-origin" });
        if (!res.ok)
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const html = await res.text();
        if (canceled || !ref.current) return;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = html;

        const base = toAbsoluteUrl(src);
        // Adjust relative URLs
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

        shadow.appendChild(wrapper);
      } catch (e) {
        if (!canceled) setErr(e);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  if (err) {
    return <div role="alert">Failed to load {src}</div>;
  }
  return <div ref={ref} />;
};
