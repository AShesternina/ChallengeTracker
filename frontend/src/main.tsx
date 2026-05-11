import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./i18n";
import "./index.css";
import { initTheme } from "./store/themeStore";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 24, fontFamily: "monospace", fontSize: 13 }}>
          <b>App error (please send this to developer):</b>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 12, color: "red" }}>
            {err.message}{"\n\n"}{err.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

initTheme();
registerSW({ onNeedRefresh() {}, onOfflineReady() {} });

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
