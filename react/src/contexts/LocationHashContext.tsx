import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type LocationHashContextValue = {
  hash: string;
};

const LocationHashContext = createContext<LocationHashContextValue | undefined>(
  undefined,
);

const getLocationHash = () => window.location.hash.slice(1);

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
    <LocationHashContext.Provider value={{ hash }}>
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
