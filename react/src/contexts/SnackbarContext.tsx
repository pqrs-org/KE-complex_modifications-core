import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type SnackbarContextValue = {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
};

const SnackbarContext = createContext<SnackbarContextValue | undefined>(
  undefined,
);

export const SnackbarContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [text, setText] = useState("");

  return (
    <SnackbarContext.Provider
      value={{
        text,
        setText,
      }}
    >
      {children}
    </SnackbarContext.Provider>
  );
};

export const useSnackbar = () => {
  const context = useContext(SnackbarContext);
  if (context === undefined) {
    throw new Error("useSnackbar must be used within SnackbarContextProvider");
  }
  return context;
};
