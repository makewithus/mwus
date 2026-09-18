"use client";

import { useEffect } from "react";
import "./globals.css";

const REDIRECT_DELAY_MS = 2500;

// This only fires if the ROOT layout itself throws (AuthProvider/ThemeProvider crash),
// so it can't rely on anything those provide - no toast/theme context, plain styling only.
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error(error);
    const timeout = setTimeout(() => {
      window.location.href = "/";
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", background: "#ffffff", color: "#09090b", padding: "2rem", textAlign: "center", fontFamily: "monospace" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>Something went wrong</h1>
        <p style={{ fontSize: "0.875rem", color: "#71717a", maxWidth: "28rem" }}>
          We hit an unexpected error. Redirecting you to the homepage - if nothing happens, use a button below.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={reset}
            style={{ padding: "0.5rem 1rem", border: "1px solid #09090b", background: "transparent", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}
          >
            Try Again
          </button>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{ padding: "0.5rem 1rem", border: "1px solid #09090b", background: "#09090b", color: "#ffffff", fontSize: "0.875rem", fontWeight: 500, cursor: "pointer" }}
          >
            Go Home
          </button>
        </div>
      </body>
    </html>
  );
}
