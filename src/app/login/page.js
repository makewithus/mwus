"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // True once Firebase auth has confirmed the credentials; we stay in a loading
  // state through this until the user's role resolves and we redirect, so the
  // form never looks "done" while it's actually still waiting on that lookup.
  const [isSignedIn, setIsSignedIn] = useState(false);
  const router = useRouter();
  const { login, user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") router.replace("/admin/dashboard");
      else if (user.role === "developer") router.replace("/developer/dashboard");
      else if (user.role === "client") router.replace("/client/dashboard");
      else router.replace("/unauthorized");
    } else if (isSignedIn && !loading && !user) {
      // Sign-in succeeded but no valid account profile could be loaded
      // (AuthContext already signed the session back out) - don't hang forever.
      setIsSignedIn(false);
      setIsLoading(false);
      toast.error("Unable to load your account. Please contact an admin.");
    }
  }, [user, loading, router, isSignedIn]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("Successfully logged in!");
      setIsSignedIn(true);
      // Keep isLoading true - the effect above redirects once the role resolves.
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Invalid email or password. Please try again.");
      setIsLoading(false);
    }
  };

  // Only the true initial bootstrap check should show the full-page loader.
  // Once a submit is in flight (isSignedIn), `loading` also flips true again while
  // the profile lookup resolves - the submit button's own "Redirecting..." label
  // already covers that, so don't blank out the form underneath it.
  if (loading && !isSignedIn) {
    return <div className="flex h-screen items-center justify-center bg-background">Loading...</div>;
  }

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
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Please enter your credentials to access your workspace.
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
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-none border border-border bg-background px-3 py-2 h-11 text-foreground placeholder-muted-foreground focus:border-foreground focus:outline-none focus:ring-1 focus:ring-foreground sm:text-sm transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full justify-center items-center h-11 rounded-none bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90 focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isSignedIn ? "Redirecting..." : isLoading ? "Signing in..." : "Sign in to account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
