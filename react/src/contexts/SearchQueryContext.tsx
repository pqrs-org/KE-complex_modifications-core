import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type SearchQueryContextValue = {
  query: string;
  setQuery: Dispatch<SetStateAction<string>>;
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
  const [query, setQuery] = useState(getSearchQuery);

  useEffect(() => {
    const handlePopState = () => setQuery(getSearchQuery());
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
