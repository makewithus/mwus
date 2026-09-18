"use client";

import { useState } from "react";
import { Button } from "./Button";
import { toast } from "sonner";

export function CredentialsModal({ email, tempPassword, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      toast.success("Password copied");
    } catch {
      toast.error("Couldn't copy - select and copy manually");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-surface border border-border p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Account Created</h2>
        <p className="text-sm text-muted-foreground">
          Share these credentials with the account owner directly (chat, phone, in person). This password is shown only once and cannot be retrieved later - use &quot;Forgot password&quot; on the login page if it&apos;s lost.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
            <div className="border border-border bg-background px-3 py-2 text-sm">{email}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Temporary Password</label>
            <div className="flex gap-2">
              <div className="flex-1 border border-border bg-background px-3 py-2 text-sm font-bold">{tempPassword}</div>
              <Button type="button" variant="outline" onClick={handleCopy}>{copied ? "Copied" : "Copy"}</Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button type="button" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
}
