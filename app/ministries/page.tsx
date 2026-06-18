import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function MinistriesPage() {
  const ministries = [
    {
      title: "Total Youth Transformation",
      description: "Empowering the next generation to break free from negative cycles, discover their unique purpose, and lead with character.",
      focus: ["Leadership Skills", "Mentorship Programs", "Youth Outreaches"],
    },
    {
      title: "Community Uplift & Outreach",
      description: "Providing physical, educational, and emotional support to underprivileged families in local communities.",
      focus: ["Food & Resource Drives", "Basic Counseling", "Tutoring Programs"],
    },
    {
      title: "Correctional Rehabilitation",
      description: "Visiting and mentoring inmates to prepare them for constructive societal reintegration and spiritual renewal.",
      focus: ["Prison Seminars", "Family Reconciliation", "Post-release Placement"],
    },
    {
      title: "Addiction & Recovery Ministry",
      description: "Providing a structured, compassionate pathway to permanent freedom from substance abuse and behavioral dependencies.",
      focus: ["Support Groups", "One-on-one Counsel", "Rehab Referrals"],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
      {/* Navbar */}
      <nav className="border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-zinc-800/50 dark:bg-zinc-900/70">
        <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            TTC Ministries
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="outline" size="sm">Admin Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Our Transformation Programs
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          At Total Transformation Center, we run multiple focused programs to bring holistic restoration and spiritual growth to individuals and communities.
        </p>
      </div>

      {/* Grid of Ministries */}
      <div className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          {ministries.map((min, index) => (
            <Card key={index} className="border-zinc-200/50 bg-white shadow-xl transition-all hover:scale-[1.01] hover:shadow-2xl dark:border-zinc-800/50 dark:bg-zinc-900">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {min.title}
                </CardTitle>
                <CardDescription className="text-zinc-500 dark:text-zinc-400 mt-2 text-base">
                  {min.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-2">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Core Areas:</h4>
                <ul className="mt-2 grid grid-cols-2 gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {min.focus.map((f, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-zinc-900 dark:bg-zinc-50" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
