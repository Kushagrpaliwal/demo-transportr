import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { PopupProvider } from "./context/PopupContext.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PopupProvider>
      <App />
    </PopupProvider>
  </StrictMode>,
);
