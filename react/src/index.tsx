import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import {
  CodeModalContextProvider,
  SearchQueryContextProvider,
  SnackbarContextProvider,
} from "./contexts";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

const root = createRoot(container);
root.render(
  <StrictMode>
    <CodeModalContextProvider>
      <SearchQueryContextProvider>
        <SnackbarContextProvider>
          <CssBaseline />
          <App />
        </SnackbarContextProvider>
      </SearchQueryContextProvider>
    </CodeModalContextProvider>
  </StrictMode>,
);
