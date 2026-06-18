"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { logOut, RootState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Simulated fetch function for upcoming ministry events
const fetchMinistryEvents = async () => {
  await new Promise((resolve) => setTimeout(resolve, 800)); // simulate latency
  return [
    { id: 1, title: "Youth Transformation Summit", date: "June 25, 2026", description: "Helping youths unlock their spiritual and personal potential.", category: "Youth" },
    { id: 2, title: "Community outreach and food drive", date: "July 2, 2026", description: "Sharing groceries and support for neighboring families.", category: "Outreach" },
    { id: 3, title: "Leadership Dev Seminar", date: "July 15, 2026", description: "Core leadership principles and growth strategies.", category: "Training" },
    { id: 4, title: "Marriage Enrichment Workshop", date: "August 5, 2026", description: "Strengthening families through biblically sound counsel.", category: "Family" },
  ];
};

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const auth = useSelector((state: RootState) => state.auth);

  // TanStack Query usage
  const { data: events, isLoading, error } = useQuery({
    queryKey: ["ministryEvents"],
    queryFn: fetchMinistryEvents,
  });

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.push("/login");
    }
  }, [auth.isAuthenticated, router]);

  const handleSignOut = () => {
    dispatch(logOut());
    router.push("/login");
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <p className="text-zinc-500">Checking authorization...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Top Header */}
      <header className="border-b border-zinc-200 bg-white/70 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">TTC Admin</span>
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              <a href="/ministries" className="hover:text-zinc-900 dark:hover:text-zinc-100">Browse Ministries</a>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{auth.user?.name}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{auth.user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Ministry Dashboard</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Manage transformational operations and upcoming activities.</p>
          </div>

          {/* Quick Metrics */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Active Programs</CardDescription>
                <CardTitle className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">12</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-500">Across 3 regional centers</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Trained Leaders</CardDescription>
                <CardTitle className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">48</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-500">+4 added this month</p>
              </CardContent>
            </Card>

            <Card className="border-zinc-200/50 bg-white shadow-sm dark:border-zinc-800/50 dark:bg-zinc-900">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Lives Impacted</CardDescription>
                <CardTitle className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">1,240+</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-zinc-500">Based on transformation reports</p>
              </CardContent>
            </Card>
          </div>

          {/* TanStack Query Integration Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Upcoming Events (React Query Stream)</h2>

            {isLoading && (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-32 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-destructive/10 p-4 text-destructive">
                Error loading events data. Please try again.
              </div>
            )}

            {events && (
              <div className="grid gap-4 sm:grid-cols-2">
                {events.map((event) => (
                  <Card key={event.id} className="border-zinc-200/50 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-800/50 dark:bg-zinc-900">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {event.category}
                        </span>
                        <span className="text-xs text-zinc-400">{event.date}</span>
                      </div>
                      <CardTitle className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-2">{event.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{event.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
