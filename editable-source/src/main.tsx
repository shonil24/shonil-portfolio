import { createRoot } from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "@/components/error-boundary";
import { initAnalytics } from "./analytics";

import "./index.css";

initAnalytics();

// Fixed: Removed the incompatible React 19 error options for stable React 18 compatibility
const container = document.getElementById("root")!;
const root = createRoot(container);

root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
