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

type JsonModalContextValue = {
  open: boolean;
  title: string;
  fetching: boolean;
  jsonString: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  openModal: (title: string, jsonUrl: string) => Promise<void>;
};

const JsonModalContext = createContext<JsonModalContextValue | undefined>(
  undefined,
);

export const JsonModalContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [fetching, setFetching] = useState(false);
  const [jsonString, setJsonString] = useState("");
  const requestIdRef = useRef(0);
  const abortControllerRef = useRef<AbortController>(null);

  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const openModal = useCallback(async (title: string, jsonUrl: string) => {
    const requestId = ++requestIdRef.current;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setTitle(title);
    setFetching(true);
    setJsonString("");

    try {
      const response = await fetch(jsonUrl, { signal: controller.signal });
      if (!response.ok) {
        throw new Error(
          `Fetch failed: ${response.status} ${response.statusText}`,
        );
      }
      const json: unknown = await response.json();
      if (requestId === requestIdRef.current) {
        setJsonString(formatJson(json));
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error(error);
      if (requestId === requestIdRef.current) {
        setJsonString(`ERROR: Failed to fetch: ${jsonUrl}`);
      }
    } finally {
      if (!controller.signal.aborted && requestId === requestIdRef.current) {
        setFetching(false);
        setOpen(true);
      }
    }
  }, []);

  const value = useMemo(
    () => ({ open, title, fetching, jsonString, setOpen, openModal }),
    [open, title, fetching, jsonString, openModal],
  );

  return <JsonModalContext value={value}>{children}</JsonModalContext>;
};

export const useJsonModal = () => {
  const context = useContext(JsonModalContext);
  if (context === undefined) {
    throw new Error(
      "useJsonModal must be used within JsonModalContextProvider",
    );
  }
  return context;
};
