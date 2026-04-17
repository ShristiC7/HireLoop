import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// Initialize API client
setBaseUrl(""); // Use empty string to let the dev/prod proxy handle it
setAuthTokenGetter(() => localStorage.getItem("hl_token"));

createRoot(document.getElementById("root")!).render(<App />);
