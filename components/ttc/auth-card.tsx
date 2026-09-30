"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AuthCardProps {
  theme: "light" | "solarised" | "dark";
  mode: "member" | "admin";
  onClose?: () => void;
}

export default function AuthCard({ theme, mode, onClose }: AuthCardProps) {
  const router = useRouter();
  const isAdmin = mode === "admin";

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate authentication logic
    setTimeout(() => {
      if (isAdmin) {
        if (email === "admin@ttc.org" && password === "admin123") {
          setIsLoading(false);
          router.push("/admin/dashboard");
        } else {
          setError("Invalid admin details. Hint: admin@ttc.org / admin123");
          setIsLoading(false);
        }
      } else {
        if (email === "member@ttc.org" && password === "member123") {
          setIsLoading(false);
          router.push("/dashboard/member");
        } else {
          setError("Invalid credentials. Hint: member@ttc.org / member123");
          setIsLoading(false);
        }
      }
    }, 1500);
  };

  // Theme-specific styles mapping
  const cardStyles = {
    light: "border-zinc-200/50 bg-white/95 shadow-2xl text-zinc-900",
    solarised: "border-slate-700/50 bg-slate-900/95 shadow-2xl ring-2 ring-indigo-500/10 text-slate-100",
    dark: "border-zinc-800/50 bg-zinc-950/95 shadow-2xl text-zinc-50",
  };

  const labelStyles = {
    light: "text-zinc-600",
    solarised: "text-slate-300",
    dark: "text-zinc-400",
  };

  const inputStyles = {
    light: "border-zinc-200 bg-white/50 focus:bg-white text-zinc-900 placeholder-zinc-400",
    solarised: "border-slate-700 bg-slate-950/50 focus:bg-slate-950 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-indigo-500",
    dark: "border-zinc-800 bg-zinc-900/50 focus:bg-zinc-900 text-zinc-100 placeholder-zinc-600 focus:border-zinc-50 focus:ring-zinc-50",
  };


  const badgeStyles = {
    light: "bg-indigo-500/10 text-indigo-600",
    solarised: "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30",
    dark: "bg-indigo-500/10 text-indigo-400",
  };

  const adminBadgeStyles = {
    light: "bg-amber-500/10 text-amber-600",
    solarised: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    dark: "bg-amber-500/10 text-amber-400",
  };

  const footerStyles = {
    light: "bg-zinc-50/50 border-t border-zinc-100 text-black font-medium",
    solarised: "bg-slate-950/40 border-t border-slate-800/80 text-indigo-200",
    dark: "bg-zinc-900/30 border-t border-zinc-900/80 text-zinc-300",
  };

  return (
    <Card className={`w-full max-w-md backdrop-blur-md relative ${cardStyles[theme]}`}>
      {/* Optional Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className={`absolute top-4 right-4 transition-colors ${theme === "light" ? "text-zinc-400 hover:text-zinc-600" : "text-zinc-500 hover:text-zinc-200"
            }`}
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      <CardHeader className="space-y-1 text-center">
        {/* Dynamic visual indicator badge */}
        <div className="flex justify-center mb-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isAdmin ? adminBadgeStyles[theme] : badgeStyles[theme]
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-amber-500" : "bg-indigo-500"}`} />
            {isAdmin ? "Protected Area" : "TTC Community"}
          </span>
        </div>

        <CardTitle className="text-3xl font-bold tracking-tight font-serif">
          {isAdmin ? "Admin Portal" : "Member Sign In"}
        </CardTitle>
        <CardDescription className={theme === "light" ? "text-zinc-500" : theme === "solarised" ? "text-slate-300" : "text-zinc-400"}>
          {isAdmin
            ? "Enter administrator credentials to access backend configurations"
            : "Sign in to connect with your church family, access resources, and more"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">

        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm font-medium text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Dynamic Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold ${labelStyles[theme]}`} htmlFor="email">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              required
              placeholder={isAdmin ? "admin@ttc.org" : "member@ttc.org"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputStyles[theme]}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`text-xs font-semibold ${labelStyles[theme]}`} htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputStyles[theme]}
            />
          </div>



          <Button
            type="submit"
            disabled={isLoading}
            className={`w-full mt-4 text-sm font-semibold transition-all duration-200 py-3 ${isAdmin
              ? "bg-amber-500 hover:bg-amber-600 text-zinc-950"
              : "bg-indigo-900 hover:bg-indigo-950 text-white"
              }`}
          >
            {isLoading
              ? "Validating credentials..."
              : "Sign In"}
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
