import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type SearchQueryContextValue = {
  query: string;
  setQuery: (query: string) => void;
};

const SearchQueryContext = createContext<SearchQueryContextValue | undefined>(
  undefined,
);

const getSearchQuery = () =>
  new URLSearchParams(window.location.search).get("q") ?? "";

export const SearchQueryContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [query, setQueryState] = useState(getSearchQuery);

  const setQuery = useCallback((nextQuery: string) => {
    setQueryState(nextQuery);
    window.history.pushState(
      { q: nextQuery },
      "",
      nextQuery === ""
        ? window.location.pathname
        : "?q=" + encodeURIComponent(nextQuery),
    );
    window.scrollTo({ top: 0, left: 0 });
  }, []);

  useEffect(() => {
    const handlePopState = () => setQueryState(getSearchQuery());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return (
    <SearchQueryContext
      value={{
        query,
        setQuery,
      }}
    >
      {children}
    </SearchQueryContext>
  );
};

export const useSearchQuery = () => {
  const context = useContext(SearchQueryContext);
  if (context === undefined) {
    throw new Error(
      "useSearchQuery must be used within SearchQueryContextProvider",
    );
  }
  return context;
};
