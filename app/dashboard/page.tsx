"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Calendar,
  Heart,
  Sparkles,
  Phone,
  ExternalLink,
  ArrowRight,
  Sun,
  Flame,
  CheckCircle,
  Radio,
  Loader2,
  Send,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import ThemeSwitcher from "@/components/ttc/theme-switcher";
import { motion, fadeUp, stagger } from "@/components/ttc/motion";

interface UserProfile {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: "MEMBER" | "ADMIN";
}

interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnail: string;
  url: string;
  isLive: boolean;
}

interface YouTubeData {
  liveStream?: {
    isLiveNow: boolean;
    videoId?: string;
    title?: string;
    thumbnail?: string;
    embedUrl?: string;
    url?: string;
  };
  liveVideos: YouTubeVideo[];
  videos: YouTubeVideo[];
}

export default function DashboardPage() {
  const router = useRouter();
  const { theme } = useTheme();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [ytData, setYtData] = useState<YouTubeData | null>(null);

  // Prayer request mini-form state
  const [prayerText, setPrayerText] = useState("");
  const [prayerStatus, setPrayerStatus] = useState<"idle" | "sending" | "sent">("idle");

  // Fetch authenticated user
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        if (!res.ok) {
          router.replace("/login");
          return;
        }

        const data = await res.json();
        if (data.success && data.user) {
          if (isMounted) {
            setUser(data.user);
            setLoading(false);
          }
        } else {
          router.replace("/login");
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        router.replace("/login");
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Fetch YouTube streams & sermon videos
  useEffect(() => {
    let isMounted = true;
    async function loadYouTube() {
      try {
        const res = await fetch("/api/youtube", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setYtData(data);
          }
        }
      } catch (err) {
        console.warn("Dashboard YouTube load error:", err);
      }
    }
    loadYouTube();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const handlePrayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;
    setPrayerStatus("sending");
    setTimeout(() => {
      setPrayerStatus("sent");
      setPrayerText("");
      setTimeout(() => setPrayerStatus("idle"), 4000);
    }, 1000);
  };

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  if (loading) {
    return (
      <main
        className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${t(
          "bg-indigo-50/60 text-zinc-900",
          "bg-slate-900 text-slate-100",
          "bg-zinc-950 text-zinc-100"
        )}`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-indigo-600 animate-pulse" />
            </div>
          </div>
          <p className="text-sm font-medium tracking-wide animate-pulse">
            Loading your member dashboard...
          </p>
        </div>
      </main>
    );
  }

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const latestLiveVideo = ytData?.liveVideos?.[0];
  const recentSermons = ytData?.liveVideos?.slice(1, 5) || [];

  return (
    <div
      className={`min-h-screen transition-colors duration-300 flex flex-col ${t(
        "bg-gradient-to-b from-indigo-50/60 via-zinc-50 to-white text-zinc-900",
        "bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100",
        "bg-gradient-to-b from-black via-zinc-950 to-zinc-900 text-zinc-100"
      )}`}
    >
      {/* ─── Top Navigation ─── */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors ${t(
          "bg-white/80 border-zinc-200/80",
          "bg-slate-900/80 border-slate-800",
          "bg-zinc-950/80 border-zinc-800"
        )}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Image
                src="/assets/TTC Logo PNG.png"
                alt="Total Transformation Center Logo"
                width={38}
                height={38}
                unoptimized
                className={`h-9 w-auto object-contain transition-transform group-hover:scale-105 ${
                  theme === "light" ? "" : "brightness-0 invert"
                }`}
              />
              <div className="flex flex-col">
                <span className="font-bold text-base sm:text-lg tracking-tight font-serif">
                  Total Transformation Center
                </span>
                <span className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-semibold">
                  Member Portal
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />

            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${t(
                "bg-zinc-100 border-zinc-200 text-zinc-700",
                "bg-slate-800 border-slate-700 text-slate-200",
                "bg-zinc-900 border-zinc-800 text-zinc-300"
              )}`}
            >
              <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs uppercase">
                {user?.name?.charAt(0) || "M"}
              </div>
              <span className="font-semibold truncate max-w-[120px]">{user?.name}</span>
              {user?.role === "ADMIN" && (
                <span className="bg-amber-500/20 text-amber-500 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">
                  Admin
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-full border transition-all duration-200 shadow-sm ${t(
                "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-red-600",
                "border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-red-400",
                "border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-red-400"
              )}`}
            >
              {loggingOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Hero Banner */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className={`relative overflow-hidden rounded-2xl p-6 sm:p-8 border shadow-lg ${t(
            "bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 text-white border-indigo-800/40",
            "bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-slate-800",
            "bg-gradient-to-r from-zinc-950 via-indigo-950 to-zinc-950 text-white border-zinc-800"
          )}`}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active Member
                </span>
                <span className="text-xs text-indigo-200 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {currentDate}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold font-serif tracking-tight">
                Welcome back, {user?.name}!
              </h1>
              <p className="text-indigo-200 text-sm sm:text-base max-w-2xl font-light">
                &quot;The Lord bless you and keep you; the Lord make his face shine on you and be gracious to you.&quot;
                <span className="italic block text-xs text-indigo-300 mt-1">— Numbers 6:24-25</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="#live-stream"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-md transition-all hover:scale-105"
              >
                <Radio className="h-4 w-4 animate-pulse text-red-600" />
                Sunday Live Service
              </Link>
              <Link
                href="#prayer-request"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20 transition-all backdrop-blur-sm"
              >
                <Heart className="h-4 w-4 text-pink-400" />
                Prayer Request
              </Link>
            </div>
          </div>

          {/* Decorative blur lights */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        </motion.div>

        {/* ─── Grid: Live Service & Quick Access ─── */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Main Featured: Latest Live / Sunday Broadcast */}
          <div
            id="live-stream"
            className={`lg:col-span-2 rounded-2xl p-6 border shadow-sm space-y-4 transition-colors ${t(
              "bg-white border-zinc-200",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif">Sunday Live Broadcast</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Watch the latest Spirit-filled service from TTC
                  </p>
                </div>
              </div>

              {ytData?.liveStream?.isLiveNow ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white uppercase tracking-wider animate-pulse">
                  ● Live Now
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  Latest Stream
                </span>
              )}
            </div>

            {latestLiveVideo ? (
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-zinc-800 group shadow-md">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${latestLiveVideo.id}`}
                    title={latestLiveVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                  <div>
                    <h3 className="font-semibold text-sm line-clamp-1">{latestLiveVideo.title}</h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Total Transformation Ministries Official Channel
                    </p>
                  </div>
                  <a
                    href={latestLiveVideo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline shrink-0"
                  >
                    Open in YouTube <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-sm text-zinc-400">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
              </div>
            )}
          </div>

          {/* Quick Member Stats & Profile Summary */}
          <div
            className={`rounded-2xl p-6 border shadow-sm flex flex-col justify-between space-y-6 transition-colors ${t(
              "bg-white border-zinc-200",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif">Member Profile</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Your account overview</p>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl border space-y-3 ${t(
                  "bg-zinc-50 border-zinc-200/70",
                  "bg-slate-950 border-slate-800",
                  "bg-zinc-900 border-zinc-800"
                )}`}
              >
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
                    Full Name
                  </span>
                  <span className="font-semibold text-sm">{user?.name}</span>
                </div>

                {user?.phone && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
                      Registered Phone
                    </span>
                    <span className="font-mono text-sm">{user.phone}</span>
                  </div>
                )}

                {user?.email && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
                      Email
                    </span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                )}

                <div>
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block">
                    Membership Status
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Good Standing (Verified)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Badges */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Pastoral Care Line
              </span>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-indigo-500" />
                  Direct Helpline:
                </span>
                <a
                  href="tel:+919876543210"
                  className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  +91 98765 43210
                </a>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ─── Service Timings & Prayer Request Row ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sunday Service Schedule */}
          <div
            className={`rounded-2xl p-6 border shadow-sm space-y-4 ${t(
              "bg-white border-zinc-200",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Sun className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif">Sunday Services</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Every Sunday morning</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">1st Morning Service</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Praise &amp; Word</span>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  07:00 AM - 09:00 AM
                </span>
              </div>

              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">2nd Morning Service</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Corporate Worship</span>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  09:00 AM - 11:00 AM
                </span>
              </div>

              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">3rd Morning Service</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Blessing &amp; Ministry</span>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  11:00 AM - 01:00 PM
                </span>
              </div>
            </div>
          </div>

          {/* Weekday Gatherings */}
          <div
            className={`rounded-2xl p-6 border shadow-sm space-y-4 ${t(
              "bg-white border-zinc-200",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif">Midweek Fellowship</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Fasting, prayer &amp; youth</p>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">Sunday Evening Gospel</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Healing &amp; Salvation</span>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-300">
                  05:00 PM - 06:00 PM
                </span>
              </div>

              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">Friday Fasting Prayer</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Deliverance Prayer</span>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-300">
                  10:00 AM - 01:00 PM
                </span>
              </div>

              <div className="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs block">Sunday School &amp; Youth</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Next-Gen Bible Class</span>
                </div>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-300">
                  09:00 AM onwards
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Prayer Request Form */}
          <div
            id="prayer-request"
            className={`rounded-2xl p-6 border shadow-sm space-y-4 ${t(
              "bg-white border-zinc-200",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-pink-500/10 text-pink-600 dark:text-pink-400 border border-pink-500/20">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-base font-serif">Prayer Request</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Our pastoral team will pray for you</p>
              </div>
            </div>

            {prayerStatus === "sent" ? (
              <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
                <h4 className="font-semibold text-sm text-emerald-600 dark:text-emerald-400">
                  Prayer Received
                </h4>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  &quot;The prayer of a righteous person is powerful and effective.&quot; (James 5:16)
                </p>
              </div>
            ) : (
              <form onSubmit={handlePrayerSubmit} className="space-y-3">
                <textarea
                  value={prayerText}
                  onChange={(e) => setPrayerText(e.target.value)}
                  required
                  rows={3}
                  placeholder="Share your prayer need, healing request, or praise report..."
                  className={`w-full text-xs p-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 ${t(
                    "bg-zinc-50 border-zinc-200 text-zinc-900 placeholder-zinc-400",
                    "bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500",
                    "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder-zinc-500"
                  )}`}
                />
                <button
                  type="submit"
                  disabled={prayerStatus === "sending"}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-900 hover:bg-indigo-950 text-white font-semibold text-xs shadow transition-all flex items-center justify-center gap-2"
                >
                  {prayerStatus === "sending" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Submit to Prayer Team
                </button>
              </form>
            )}
          </div>
        </div>

        {/* ─── Recent Sermons Archive ─── */}
        {recentSermons.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif">Recent Sunday Sermons</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Catch up on messages you missed or re-watch your favorites
                </p>
              </div>
              <a
                href="https://www.youtube.com/@TotalTransformationMinistries/streams"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                View all streams <ArrowRight className="h-3 w-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentSermons.map((video) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 ${t(
                    "bg-white border-zinc-200 hover:border-indigo-300",
                    "bg-slate-900 border-slate-800 hover:border-slate-700",
                    "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                  )}`}
                >
                  <div className="relative aspect-video bg-black overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[10px] text-white font-mono">
                      Service
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h4 className="text-xs font-semibold line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {video.title}
                    </h4>
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                      Total Transformation Ministries
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ─── Footer ─── */}
      <footer
        className={`mt-auto border-t py-6 transition-colors ${t(
          "bg-white border-zinc-200 text-zinc-500",
          "bg-slate-900 border-slate-800 text-slate-400",
          "bg-zinc-950 border-zinc-800 text-zinc-500"
        )}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} Total Transformation Center. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:underline">
              Church Website
            </Link>
            <Link href="/login" className="hover:underline">
              Switch Account
            </Link>
            <a
              href="https://www.youtube.com/@TotalTransformationMinistries"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              YouTube Channel
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
