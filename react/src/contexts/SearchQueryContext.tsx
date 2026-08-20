import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
  type ReactNode,
} from "react";

type SearchQueryContextValue = {
  isReturningToList: boolean;
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
  const [isReturningToList, startTransition] = useTransition();

  const setQuery = useCallback(
    (nextQuery: string) => {
      if (query !== "" && nextQuery === "") {
        startTransition(() => setQueryState(nextQuery));
      } else {
        setQueryState(nextQuery);
      }
      window.history.pushState(
        { q: nextQuery },
        "",
        nextQuery === ""
          ? window.location.pathname
          : "?q=" + encodeURIComponent(nextQuery),
      );
      window.scrollTo({ top: 0, left: 0 });
    },
    [query],
  );

  useEffect(() => {
    const handlePopState = () => {
      const nextQuery = getSearchQuery();
      if (query !== "" && nextQuery === "") {
        startTransition(() => setQueryState(nextQuery));
      } else {
        setQueryState(nextQuery);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [query]);

  return (
    <SearchQueryContext
      value={{
        isReturningToList,
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
