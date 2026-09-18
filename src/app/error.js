"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const REDIRECT_DELAY_MS = 2000;

export default function ErrorBoundary({ error, reset }) {
  useEffect(() => {
    console.error(error);
    toast.error("Something went wrong. Redirecting you...");
    // A hard navigation here (not the SPA router) guarantees recovery even if the
    // error left the router or app state in a bad spot - this is the last-resort
    // safety net, so it can't depend on the same machinery that just failed.
    const timeout = setTimeout(() => {
      window.location.href = "/";
    }, REDIRECT_DELAY_MS);
    return () => clearTimeout(timeout);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background text-foreground p-8 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-sm text-muted-foreground max-w-md">
        We hit an unexpected error. You&apos;re being redirected to the homepage - if nothing happens, use a button below.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 border border-border text-sm font-medium hover:bg-muted transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => { window.location.href = "/"; }}
          className="px-4 py-2 bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
