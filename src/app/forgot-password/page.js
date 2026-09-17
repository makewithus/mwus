"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send reset email");
      }

      toast.success(data.message || "Password reset link sent to your email!");
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-foreground p-12 text-background">
        <div>
          <img src="/images/mwulogo-removebg.png" alt="MakeWithUs Logo" className="h-16 w-auto object-contain mb-4 brightness-0 invert" />
          <p className="mt-2 text-sm opacity-80">Client Project Tracking Portal V1</p>
        </div>
        <div className="max-w-md">
          <p className="text-xl font-medium leading-relaxed">
            &quot;We provide complete transparency and radical accountability across every phase of your project lifecycle.&quot;
          </p>
          <p className="mt-4 text-sm opacity-60">MakeWithUs Operations Team</p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Reset password</h2>
            <p className="text-sm text-muted-foreground">
              Enter your email address and we will send you a link to reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-foreground">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full appearance-none rounded-none border border-border bg-background px-3 py-2 h-11 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground sm:text-sm transition-colors"
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-4">
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center h-11 rounded-none bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isLoading ? "Sending link..." : "Send reset link"}
              </button>
              
              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
