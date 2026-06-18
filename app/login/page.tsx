"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { setCredentials } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { RootState } from "@/lib/store";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate API request authentication
    setTimeout(() => {
      if (email === "admin@ttc.org" && password === "admin123") {
        dispatch(
          setCredentials({
            token: "mock-jwt-token-xyz-12345",
            user: {
              name: "Ministry Leader",
              email: "admin@ttc.org",
            },
          })
        );
        setIsLoading(false);
        router.push("/dashboard");
      } else {
        setError("Invalid email or password. Use: admin@ttc.org / admin123");
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 p-4 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      <Card className="w-full max-w-md border-zinc-200/50 bg-white/80 shadow-2xl backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/80">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-zinc-500 dark:text-zinc-400">
            Enter credentials to manage Total Transformation Center
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-lg bg-destructive/15 p-3 text-sm font-medium text-destructive dark:bg-destructive/10">
                {error}
              </div>
            )}
            {auth.isAuthenticated && (
              <div className="rounded-lg bg-green-500/15 p-3 text-sm font-medium text-green-600 dark:bg-green-500/10 dark:text-green-400">
                Already authenticated! Redirecting...
                {setTimeout(() => router.push("/dashboard"), 1000) && null}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ttc.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-zinc-300 bg-white focus:border-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-zinc-700 dark:text-zinc-300" htmlFor="password">
                  Password
                </label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-zinc-300 bg-white focus:border-zinc-950 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-50 dark:focus:ring-zinc-50"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-950 hover:bg-zinc-800 text-zinc-50 dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-950"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-xs text-zinc-400 dark:text-zinc-500">
              Demo access: <code className="text-zinc-600 dark:text-zinc-400">admin@ttc.org</code> / <code className="text-zinc-600 dark:text-zinc-400">admin123</code>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
