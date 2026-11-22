import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource-variable/alexandria/wght.css";
import "@fontsource-variable/space-grotesk";
import "./i18n/config";
import "./styles/globals.css";
import { initTheme } from "./lib/compat/theme";
import { App } from "./App";

initTheme();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
