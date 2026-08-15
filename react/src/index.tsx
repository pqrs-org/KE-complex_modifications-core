import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline } from "@mui/material";
import App from "./App";
import {
  JsonModalContextProvider,
  SearchQueryContextProvider,
  SnackbarContextProvider,
} from "./contexts";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

const root = createRoot(container);
root.render(
  <StrictMode>
    <JsonModalContextProvider>
      <SearchQueryContextProvider>
        <SnackbarContextProvider>
          <CssBaseline />
          <App />
        </SnackbarContextProvider>
      </SearchQueryContextProvider>
    </JsonModalContextProvider>
  </StrictMode>,
);
