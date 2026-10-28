"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BannerAlert } from "@/components/ui/banner-alert";
import { useQueryClient } from "@tanstack/react-query";
import { setCachedUser } from "@/hooks/use-auth";

interface AuthCardProps {
  theme: "light" | "solarised" | "dark";
  mode: "member" | "admin";
  onClose?: () => void;
}

export default function AuthCard({ theme, mode, onClose }: AuthCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isAdmin = mode === "admin";

  // Form states
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!identifier.trim() || !password) {
      setError(
        isAdmin
          ? "Please enter your admin email or phone number and password."
          : "Please enter your phone number or email and password."
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin", // ensures cookies are set
        body: JSON.stringify({
          phone: identifier.trim(),
          email: identifier.trim(),
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Invalid credentials. Please verify and try again.");
        setIsLoading(false);
        return;
      }

      const roleUpper = data.user?.role?.toUpperCase?.() || "";
      const isAuthorizedRole = roleUpper.includes("ADMIN") || roleUpper === "SUPER ADMIN";

      if (isAdmin && !isAuthorizedRole) {
        setError("Access restricted: This account does not possess administrator privileges.");
        setIsLoading(false);
        return;
      }

      // Cache authenticated user profile immediately for seamless UI transition
      if (data.user) {
        setCachedUser(data.user);
        queryClient.setQueryData(["currentUser"], data.user);
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      }

      if (typeof window !== "undefined") {
        sessionStorage.removeItem("ttc_dismiss_reset_banner");
      }

      setSuccessMsg(
        isAdmin
          ? "Welcome, Administrator!"
          : "Welcome back!"
      );

      // Short delay for smooth visual feedback before redirect
      setTimeout(() => {
        const searchParams = new URLSearchParams(window.location.search);
        const returnUrl = searchParams.get("returnUrl");
        const target = returnUrl || (isAdmin ? "/admin/dashboard" : "/dashboard");
        router.push(target);
        router.refresh();
      }, 500);
    } catch (err) {
      console.error("Login submission error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach the server. Please check your network connection and try again."
      );
      setIsLoading(false);
    }
  };

  // Theme-specific styles mapping
  const cardStyles = {
    light: "border-zinc-200/80 bg-white/95 shadow-2xl text-zinc-900",
    solarised: "border-slate-700/60 bg-slate-900/95 shadow-2xl ring-2 ring-indigo-500/10 text-slate-100",
    dark: "border-zinc-800/80 bg-zinc-950/95 shadow-2xl text-zinc-50",
  };

  const labelStyles = {
    light: "text-zinc-700",
    solarised: "text-slate-300",
    dark: "text-zinc-300",
  };

  const inputStyles = {
    light: "border-zinc-200 bg-white/70 focus:bg-white text-zinc-900 placeholder-zinc-400 focus:border-indigo-600 focus:ring-indigo-600",
    solarised: "border-slate-700 bg-slate-950/60 focus:bg-slate-950 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500",
    dark: "border-zinc-800 bg-zinc-900/60 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-500 focus:border-zinc-50 focus:ring-zinc-50",
  };

  const badgeStyles = {
    light: "bg-indigo-500/10 text-indigo-700 border border-indigo-200/60",
    solarised: "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
    dark: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
  };

  const adminBadgeStyles = {
    light: "bg-amber-500/10 text-amber-700 border border-amber-200/60",
    solarised: "bg-amber-500/20 text-amber-300 border border-amber-500/30",
    dark: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  };

  const footerStyles = {
    light: "bg-zinc-50/70 border-t border-zinc-100 text-zinc-700 font-medium",
    solarised: "bg-slate-950/60 border-t border-slate-800/80 text-indigo-200",
    dark: "bg-zinc-900/50 border-t border-zinc-900/80 text-zinc-300",
  };

  return (
    <Card className={`w-full max-w-md backdrop-blur-md relative ${cardStyles[theme]}`}>
      {/* Optional Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          aria-label="Close"
          className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${theme === "light"
            ? "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <CardHeader className="space-y-1 text-center">
        {/* Dynamic visual indicator badge */}
        <div className="flex justify-center mb-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isAdmin ? adminBadgeStyles[theme] : badgeStyles[theme]
              }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-amber-500 animate-pulse" : "bg-indigo-500 animate-pulse"}`} />
            {isAdmin ? "Total Transformation Center" : "TTC Member Sign In"}
          </span>
        </div>

        <CardTitle className="text-3xl font-bold tracking-tight font-serif">
          {isAdmin ? "Admin Portal" : "Welcome Home"}
        </CardTitle>
        <CardDescription
          className={
            theme === "light"
              ? "text-zinc-500"
              : theme === "solarised"
                ? "text-slate-300"
                : "text-zinc-400"
          }
        >
          {isAdmin
            ? "Enter administrator credentials to access management controls"
            : "Sign in with your registered phone number to access your member dashboard"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && (
          <BannerAlert
            variant="error"
            title="Authentication Failed"
            message={error}
            onClose={() => setError("")}
          />
        )}

        {successMsg && (
          <BannerAlert
            variant="success"
            title="Success"
            message={successMsg}
            onClose={() => setSuccessMsg("")}
          />
        )}

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center">
              <label className={`text-xs font-semibold ${labelStyles[theme]}`} htmlFor="identifier">
                {isAdmin ? "Admin Email or Phone" : "Phone Number"}
              </label>
            </div>
            <Input
              id="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder={isAdmin ? "admin@ttc.org or +91 98765 00001" : "+919800098000"}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={inputStyles[theme]}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold ${labelStyles[theme]}`} htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`pr-10 ${inputStyles[theme]}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || Boolean(successMsg)}
            className={`w-full mt-4 text-sm font-semibold transition-all duration-200 py-3 shadow-md hover:shadow-lg ${isAdmin
              ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold"
              : "bg-indigo-900 hover:bg-indigo-950 text-white"
              }`}
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : successMsg ? (
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Signed In
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Sign In to Admin Dashboard
              </span>
            ) : (
              "Sign In with Phone"
            )}
          </Button>
        </form>

      </CardContent>

      <CardFooter className={`flex flex-col gap-1 text-center text-xs px-6 pb-6 pt-4 font-medium rounded-b-xl ${footerStyles[theme]}`}>
        <p className="leading-relaxed font-serif italic">
          &quot;Thank you for being a part of our church family.
          <br />
          We are blessed to have you!&quot;
        </p>
      </CardFooter>
    </Card>
  );
}
