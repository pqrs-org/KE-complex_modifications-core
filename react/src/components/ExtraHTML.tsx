import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
};

export const ExtraHTML = ({ src }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const [err, setErr] = useState<unknown>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const res = await fetch(src, { credentials: "same-origin" });
        if (!res.ok)
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const html = await res.text();
        if (canceled || !ref.current) return;
        ref.current.innerHTML = html;

        // Adjust relative URLs
        const abs = (value: string | null) => {
          const base = `${window.location.protocol}//${window.location.host}${window.location.pathname}${src}`;

          if (!value) return value;
          try {
            return new URL(value, base).href;
          } catch {
            return value;
          }
        };
        ref.current.querySelectorAll<HTMLElement>("[src]").forEach((el) => {
          const v = (el as HTMLImageElement).getAttribute("src");
          const a = abs(v);
          if (a && a !== v) (el as HTMLImageElement).setAttribute("src", a);
        });
        ref.current
          .querySelectorAll<HTMLAnchorElement>("a[href], link[href]")
          .forEach((el) => {
            const v = el.getAttribute("href");
            const a = abs(v);
            if (a && a !== v) el.setAttribute("href", a);
          });
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
