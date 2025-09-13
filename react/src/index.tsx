import React from "react";
import { createRoot } from "react-dom/client";
import { CssBaseline } from "@mui/material";
import "bootstrap/dist/css/bootstrap.min.css";
import App from "./App";
import {
  JsonModalContextProvider,
  LocationHashContextProvider,
  SearchQueryContextProvider,
  SnackbarContextProvider,
} from "./contexts";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found");

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <JsonModalContextProvider>
      <LocationHashContextProvider>
        <SearchQueryContextProvider>
          <SnackbarContextProvider>
            <CssBaseline />
            <App />
          </SnackbarContextProvider>
        </SearchQueryContextProvider>
      </LocationHashContextProvider>
    </JsonModalContextProvider>
  </React.StrictMode>,
);
