import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./i18n";
import "./index.css";
import { initTheme } from "./store/themeStore";

initTheme();
registerSW({ onNeedRefresh() {}, onOfflineReady() {} });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
