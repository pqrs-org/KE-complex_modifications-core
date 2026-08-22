import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { formatJson } from "../utils/jsonFormatter";

type CodeModalContextValue = {
  open: boolean;
  title: string;
  fetching: boolean;
  source: string;
  language: "json" | "javascript";
  setOpen: Dispatch<SetStateAction<boolean>>;
  openModal: (title: string, sourceUrl: string) => Promise<void>;
};

const CodeModalContext = createContext<CodeModalContextValue | undefined>(
  undefined,
);

export const CodeModalContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fetching, setFetching] = useState(false);
  const [source, setSource] = useState("");
  const [language, setLanguage] = useState<"json" | "javascript">("json");
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController>(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const openModal = useCallback(async (title: string, sourceUrl: string) => {
    const requestId = ++requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setTitle(title);
    setFetching(true);
    setSource("");
    const sourceLanguage = sourceUrl.endsWith(".js") ? "javascript" : "json";
    setLanguage(sourceLanguage);

    try {
      const response = await fetch(sourceUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(
          `Fetch failed: ${response.status} ${response.statusText}`,
        );
      }
      const source =
        sourceLanguage === "javascript"
          ? await response.text()
          : formatJson((await response.json()) as unknown);
      if (requestId === requestIdRef.current) {
        setSource(source);
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      if (requestId === requestIdRef.current) {
        setSource(`ERROR: Failed to fetch: ${sourceUrl}`);
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setFetching(false);
        setOpen(true);
      }
    }
  }, []);

  const value = useMemo(
    () => ({ open, title, fetching, source, language, setOpen, openModal }),
    [open, title, fetching, source, language, openModal],
  );

  return <CodeModalContext value={value}>{children}</CodeModalContext>;
};

export const useCodeModal = () => {
  const context = useContext(CodeModalContext);
  if (context === undefined) {
    throw new Error(
      "useCodeModal must be used within CodeModalContextProvider",
    );
  }
  return context;
};
