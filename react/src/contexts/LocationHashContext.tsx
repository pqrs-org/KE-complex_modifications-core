import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type LocationHashContextValue = {
  hash: string;
  setHash: Dispatch<SetStateAction<string>>;
};

const LocationHashContext = createContext<LocationHashContextValue | undefined>(
  undefined,
);

const getLocationHash = () => {
  const hash = window.location.hash.slice(1);
  try {
    return decodeURIComponent(hash);
  } catch {
    return hash;
  }
};

export const LocationHashContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [hash, setHash] = useState(getLocationHash);

  useEffect(() => {
    const handleHashChange = () => setHash(getLocationHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <LocationHashContext.Provider value={{ hash, setHash }}>
      {children}
    </LocationHashContext.Provider>
  );
};

export const useLocationHash = () => {
  const context = useContext(LocationHashContext);
  if (context === undefined) {
    throw new Error(
      "useLocationHash must be used within LocationHashContextProvider",
    );
  }
  return context;
};
