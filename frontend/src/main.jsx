import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { AuthProvider } from "./modules/auth/AuthContext";
import "./index.css";

// ลงทะเบียน Service Worker สำหรับรองรับการติดตั้งเป็นแอป (PWA)
if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("PWA Service Worker registered successfully:", reg.scope);
      })
      .catch((err) => {
        console.log("PWA Service Worker registration failed:", err);
      });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
