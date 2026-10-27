"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sun,
  Heart,
  GraduationCap,
  Flame,
  Users,
  HeartHandshake,
  Sparkles,
  Home as HomeIcon,
  BookOpen,
  Moon,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Mail,
  UserCheck,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { useTheme } from "@/components/ttc/theme-provider";
import ThemeSwitcher from "@/components/ttc/theme-switcher";
import YouTubeSection from "@/components/ttc/youtube-section";
import LiveStreamModal from "@/components/ttc/live-stream-modal";
import {
  motion,
  fadeUp,
  stagger,
  staggerSlow,
  staggerFast,
  viewportOnce,
} from "@/components/ttc/motion";

interface ChurchActivity {
  id: string;
  title: string;
  category: "sunday" | "weekday";
  frequency: string;
  time: string;
  slots?: { label: string; time: string }[];
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: {
    light: string;
    solarised: string;
    dark: string;
  };
}

const churchActivities: ChurchActivity[] = [
  {
    id: "sunday-service",
    title: "Sunday Service",
    category: "sunday",
    frequency: "Every Sunday",
    time: "3 Morning Services",
    slots: [
      { label: "1st Service", time: "07:00 am - 09:00 am" },
      { label: "2nd Service", time: "09:00 am - 11:00 am" },
      { label: "3rd Service", time: "11:00 am - 01:00 pm" },
    ],
    description:
      "Uplifting praise, vibrant corporate worship, and Spirit-led biblical preaching across three Sunday morning services.",
    icon: Sun,
    badgeColor: {
      light: "bg-amber-100 text-amber-800 border-amber-200",
      solarised: "bg-amber-950/60 text-amber-300 border-amber-800/60",
      dark: "bg-amber-950/40 text-amber-300 border-amber-800/40",
    },
  },
  {
    id: "gospel-sharing",
    title: "Gospel Sharing",
    category: "sunday",
    frequency: "Every Sunday",
    time: "05:00 pm - 06:00 pm",
    description:
      "Proclaiming the good news of Jesus Christ with salvation, healing, deliverances, and life-changing prayers.",
    icon: Flame,
    badgeColor: {
      light: "bg-orange-100 text-orange-800 border-orange-200",
      solarised: "bg-orange-950/60 text-orange-300 border-orange-800/60",
      dark: "bg-orange-950/40 text-orange-300 border-orange-800/40",
    },
  },
  {
    id: "sunday-class",
    title: "Sunday Class",
    category: "sunday",
    frequency: "Every Sunday",
    time: "09:00 am onwards",
    description:
      "Nurturing children and adolescents in God's Word through age-appropriate biblical lessons, songs, and activities.",
    icon: GraduationCap,
    badgeColor: {
      light: "bg-emerald-100 text-emerald-800 border-emerald-200",
      solarised: "bg-emerald-950/60 text-emerald-300 border-emerald-800/60",
      dark: "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
    },
  },
  {
    id: "holy-communion",
    title: "Holy Communion",
    category: "sunday",
    frequency: "Every 1st Sunday",
    time: "During Sunday Services",
    description:
      "A sacred time of remembrance and thanksgiving, partaking of the Lord's table together in unity as one church family.",
    icon: Heart,
    badgeColor: {
      light: "bg-rose-100 text-rose-800 border-rose-200",
      solarised: "bg-rose-950/60 text-rose-300 border-rose-800/60",
      dark: "bg-rose-950/40 text-rose-300 border-rose-800/40",
    },
  },
  {
    id: "youth-fellowship",
    title: "Youth Fellowship",
    category: "sunday",
    frequency: "Every 2nd Sunday",
    time: "05:30 pm - 07:00 pm",
    description:
      "An energetic gathering for young adults featuring passionate worship, relevant discussions, and purposeful leadership.",
    icon: Flame,
    badgeColor: {
      light: "bg-amber-100 text-amber-800 border-amber-200",
      solarised: "bg-amber-950/60 text-amber-300 border-amber-800/60",
      dark: "bg-amber-950/40 text-amber-300 border-amber-800/40",
    },
  },
  {
    id: "fellowship",
    title: "Men's & Women's Fellowship",
    category: "sunday",
    frequency: "Every 3rd Sunday",
    time: "06:30 pm - 08:00 pm",
    description:
      "A dedicated gathering for men and women to connect, share testimonies, and strengthen each other in faith and family life.",
    icon: Users,
    badgeColor: {
      light: "bg-purple-100 text-purple-800 border-purple-200",
      solarised: "bg-purple-950/60 text-purple-300 border-purple-800/60",
      dark: "bg-purple-950/40 text-purple-300 border-purple-800/40",
    },
  },
  {
    id: "couples-gathering",
    title: "Couples Gathering",
    category: "sunday",
    frequency: "Every 4th Sunday",
    time: "06:30 pm - 08:00 pm",
    description:
      "Biblical marriage counseling, spiritual guidance, and encouraging fellowship to build strong, Christ-centered marriages and families.",
    icon: HeartHandshake,
    badgeColor: {
      light: "bg-blue-100 text-blue-800 border-blue-200",
      solarised: "bg-blue-950/60 text-blue-300 border-blue-800/60",
      dark: "bg-blue-950/40 text-blue-300 border-blue-800/40",
    },
  },
  {
    id: "pre-youth",
    title: "Pre - Youth Meeting",
    category: "weekday",
    frequency: "Every Monday",
    time: "08:00 pm - 09:00 pm",
    description:
      "Guiding young teens and pre-youth with Christ-centered values, wholesome fellowship, and positive peer encouragement.",
    icon: Sparkles,
    badgeColor: {
      light: "bg-sky-100 text-sky-800 border-sky-200",
      solarised: "bg-sky-950/60 text-sky-300 border-sky-800/60",
      dark: "bg-sky-950/40 text-sky-300 border-sky-800/40",
    },
  },
  {
    id: "cottage-prayer",
    title: "Cottage Prayer",
    category: "weekday",
    frequency: "Every Tuesday",
    time: "07:00 pm onwards",
    description:
      "Warm, intimate fellowship in members' homes for heartfelt prayer, mutual encouragement, and spiritual communion.",
    icon: HomeIcon,
    badgeColor: {
      light: "bg-teal-100 text-teal-800 border-teal-200",
      solarised: "bg-teal-950/60 text-teal-300 border-teal-800/60",
      dark: "bg-teal-950/40 text-teal-300 border-teal-800/40",
    },
  },
  {
    id: "bible-study",
    title: "Bible Study",
    category: "weekday",
    frequency: "Every Wednesday",
    time: "09:00 am - 10:00 am",
    description:
      "Systematic study of the Scriptures to enrich doctrinal understanding and equip believers for everyday Christian living.",
    icon: BookOpen,
    badgeColor: {
      light: "bg-indigo-100 text-indigo-800 border-indigo-200",
      solarised: "bg-indigo-950/60 text-indigo-300 border-indigo-800/60",
      dark: "bg-indigo-950/40 text-indigo-300 border-indigo-800/40",
    },
  },
  {
    id: "fasting-prayer",
    title: "Fasting Prayer",
    category: "weekday",
    frequency: "Every Friday",
    time: "11:00 am - 01:00 pm",
    description:
      "Weekly fasting and intercessory prayer seeking God's divine favor, deliverance, and breakthroughs for families and nations.",
    icon: Heart,
    badgeColor: {
      light: "bg-red-100 text-red-800 border-red-200",
      solarised: "bg-red-950/60 text-red-300 border-red-800/60",
      dark: "bg-red-950/40 text-red-300 border-red-800/40",
    },
  },
  {
    id: "half-night-prayer",
    title: "Half Night Prayer",
    category: "weekday",
    frequency: "Every Month 2nd Friday",
    time: "10:00 pm - 01:00 am",
    description:
      "An extended late-night vigil of fervent spiritual warfare, prophetic prayers, and powerful presence of the Holy Spirit.",
    icon: Moon,
    badgeColor: {
      light: "bg-violet-100 text-violet-800 border-violet-200",
      solarised: "bg-violet-950/60 text-violet-300 border-violet-800/60",
      dark: "bg-violet-950/40 text-violet-300 border-violet-800/40",
    },
  },
];

export default function Home() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"all" | "sunday" | "weekday">("all");

  useEffect(() => {
    document.title = "Total Transformation Center | Where Lives Find Purpose & Grace";
  }, []);

  /** Shorthand helper to pick class per active theme */
  const t = (light: string, solarised: string, dark: string) =>
    theme === "light" ? light : theme === "solarised" ? solarised : dark;

  // Dynamically compute counts per category in an optimized single pass
  const categoryCounts = useMemo(() => {
    let sunday = 0;
    let weekday = 0;
    for (let i = 0; i < churchActivities.length; i++) {
      if (churchActivities[i].category === "sunday") sunday++;
      else if (churchActivities[i].category === "weekday") weekday++;
    }
    return {
      all: churchActivities.length,
      sunday,
      weekday,
    };
  }, []);

  const tabs = useMemo(
    () =>
      [
        { id: "all" as const, label: "All Gatherings", count: categoryCounts.all },
        { id: "sunday" as const, label: "Sunday Services", count: categoryCounts.sunday },
        { id: "weekday" as const, label: "Weekday Gatherings", count: categoryCounts.weekday },
      ] as const,
    [categoryCounts]
  );

  const filteredActivities = useMemo(() => {
    if (activeTab === "all") return churchActivities;
    return churchActivities.filter((act) => act.category === activeTab);
  }, [activeTab]);

  return (
    <main
      className={`min-h-screen font-sans transition-colors duration-500 ${t(
        "bg-white text-zinc-900",
        "bg-slate-900 text-slate-100",
        "bg-zinc-950 text-zinc-50"
      )}`}
    >
      {/* ─── Auto Live Stream Pop-up (when stream is broadcasting) ─── */}
      <LiveStreamModal />

      {/* ─── Navigation ─── */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`fixed top-0 w-full z-50 backdrop-blur-xl border-b transition-colors duration-500 ${t(
          "bg-white/80 border-zinc-200/80 shadow-xs",
          "bg-slate-900/80 border-slate-700/60 shadow-md",
          "bg-zinc-950/80 border-zinc-800/60 shadow-md"
        )}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/TTC Logo PNG.png"
              alt="TTC Logo"
              width={40}
              height={40}
              unoptimized
              className={`h-9 w-auto object-contain ${t(
                "",
                "brightness-0 invert",
                "brightness-0 invert"
              )}`}
            />
            <div className="flex flex-col">
              <span
                className={`font-serif font-bold text-base sm:text-lg leading-tight ${t(
                  "text-indigo-950",
                  "text-slate-100",
                  "text-zinc-50"
                )}`}
              >
                Total Transformation Ministries
              </span>
              <span
                className={`text-[10px] hidden sm:inline uppercase tracking-widest font-medium ${t(
                  "text-zinc-500",
                  "text-slate-400",
                  "text-zinc-400"
                )}`}
              >
                Church &amp; Community Center
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-full transition-all duration-200 shadow-sm hover:shadow-md ${t(
                "bg-indigo-900 text-white hover:bg-indigo-950",
                "bg-indigo-600 text-white hover:bg-indigo-700",
                "bg-zinc-100 text-zinc-900 hover:bg-white"
              )}`}
            >
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ─── Hero ─── */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 overflow-hidden">
        {/* Decorative background gradients */}
        <div
          className={`absolute inset-0 ${t(
            "bg-gradient-to-b from-indigo-50/80 via-white to-white",
            "bg-gradient-to-b from-slate-800/50 via-slate-900 to-slate-900",
            "bg-gradient-to-b from-zinc-900/50 via-zinc-950 to-zinc-950"
          )}`}
        />
        <div
          className={`absolute top-20 left-1/4 w-72 sm:w-96 h-72 sm:h-96 rounded-full blur-3xl pointer-events-none ${t(
            "bg-purple-200/30",
            "bg-indigo-800/20",
            "bg-indigo-900/15"
          )}`}
        />
        <div
          className={`absolute top-40 right-1/4 w-60 sm:w-80 h-60 sm:h-80 rounded-full blur-3xl pointer-events-none ${t(
            "bg-indigo-200/30",
            "bg-purple-800/15",
            "bg-purple-900/10"
          )}`}
        />

        <motion.div
          className="relative max-w-4xl mx-auto text-center"
          variants={staggerSlow}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="inline-block mb-6">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm ${t(
                "bg-indigo-100/90 text-indigo-800 border border-indigo-200/80 shadow-xs",
                "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30",
                "bg-indigo-500/15 text-indigo-300 border border-indigo-500/25"
              )}`}
            >
              <span className="h-2 w-2 bg-indigo-500 rounded-full animate-pulse" />
              Welcome to Total Transformation Ministries
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight leading-[1.1] mb-6 ${t(
              "text-indigo-950",
              "text-slate-50",
              "text-zinc-50"
            )}`}
          >
            Where Lives Are{" "}
            <span
              className={`bg-clip-text text-transparent ${t(
                "bg-gradient-to-r from-indigo-600 to-purple-600",
                "bg-gradient-to-r from-indigo-400 to-purple-400",
                "bg-gradient-to-r from-indigo-400 to-purple-500"
              )}`}
            >
              Transformed
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className={`text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed ${t(
              "text-zinc-600",
              "text-slate-300",
              "text-zinc-400"
            )}`}
          >
            A community rooted in faith, united by love, and committed to seeing
            every life reach its God-given potential. Come worship with us.
          </motion.p>

          {/* Quick Sunday Service times highlight */}
          <motion.div
            variants={fadeUp}
            className={`max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl border backdrop-blur-md mb-8 ${t(
              "bg-white/80 border-indigo-100 shadow-md shadow-indigo-100/40",
              "bg-slate-800/80 border-slate-700/80 shadow-lg",
              "bg-zinc-900/80 border-zinc-800/80 shadow-lg"
            )}`}
          >
            <div className="flex items-center justify-center gap-2 mb-2.5">
              <Sun className="h-4 w-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Sunday Morning Worship
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm font-medium">
              <div
                className={`py-2 px-3 rounded-xl border ${t(
                  "bg-indigo-50/70 border-indigo-100 text-indigo-950",
                  "bg-slate-900/80 border-slate-700 text-slate-200",
                  "bg-zinc-950/80 border-zinc-800 text-zinc-200"
                )}`}
              >
                <span className="block text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
                  1st Service
                </span>
                07:00 am - 09:00 am
              </div>
              <div
                className={`py-2 px-3 rounded-xl border ${t(
                  "bg-indigo-50/70 border-indigo-100 text-indigo-950",
                  "bg-slate-900/80 border-slate-700 text-slate-200",
                  "bg-zinc-950/80 border-zinc-800 text-zinc-200"
                )}`}
              >
                <span className="block text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
                  2nd Service
                </span>
                09:00 am - 11:00 am
              </div>
              <div
                className={`py-2 px-3 rounded-xl border ${t(
                  "bg-indigo-50/70 border-indigo-100 text-indigo-950",
                  "bg-slate-900/80 border-slate-700 text-slate-200",
                  "bg-zinc-950/80 border-zinc-800 text-zinc-200"
                )}`}
              >
                <span className="block text-[11px] font-semibold text-indigo-500 dark:text-indigo-400">
                  3rd Service
                </span>
                11:00 am - 01:00 pm
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/login"
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 font-semibold rounded-full transition-all duration-200 hover:-translate-y-0.5 ${t(
                "bg-indigo-900 text-white shadow-lg shadow-indigo-900/20 hover:bg-indigo-950 hover:shadow-xl hover:shadow-indigo-900/30",
                "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-xl",
                "bg-zinc-100 text-zinc-900 shadow-lg shadow-zinc-100/10 hover:bg-white hover:shadow-xl"
              )}`}
            >
              Member Sign In
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#activities"
              className={`inline-flex items-center justify-center gap-2 px-8 py-3.5 font-semibold rounded-full border transition-all duration-200 ${t(
                "bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50 shadow-xs",
                "bg-slate-800/60 text-slate-200 border-slate-600 hover:bg-slate-800",
                "bg-zinc-900/60 text-zinc-200 border-zinc-700 hover:bg-zinc-900"
              )}`}
            >
              View All Timings
              <ChevronRight className="h-4 w-4" />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Activities Section ─── */}
      <section
        id="activities"
        className={`py-20 sm:py-24 px-4 transition-colors duration-500 ${t(
          "bg-zinc-50/60",
          "bg-slate-900/40",
          "bg-zinc-900/30"
        )}`}
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            className="text-center mb-10 sm:mb-12"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <motion.span
              variants={fadeUp}
              className={`text-xs sm:text-sm font-semibold uppercase tracking-wider ${t(
                "text-indigo-600",
                "text-indigo-400",
                "text-indigo-400"
              )}`}
            >
              Gatherings &amp; Fellowships
            </motion.span>
            <motion.h2
              variants={fadeUp}
              className={`text-3xl sm:text-4xl md:text-5xl font-serif font-bold mt-2 ${t(
                "text-indigo-950",
                "text-slate-100",
                "text-zinc-50"
              )}`}
            >
              Church Activities &amp; Timings
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className={`mt-3 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed ${t(
                "text-zinc-600",
                "text-slate-400",
                "text-zinc-400"
              )}`}
            >
              We welcome you to join us across our regular weekly worship
              services, prayer meetings, and fellowships.
            </motion.p>

            {/* Filter Tabs */}
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-center gap-2 mt-8 flex-wrap"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${isActive
                      ? t(
                        "bg-indigo-900 text-white shadow-md",
                        "bg-indigo-600 text-white shadow-md",
                        "bg-zinc-100 text-zinc-900 shadow-md"
                      )
                      : t(
                        "bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200",
                        "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700",
                        "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
                      )
                      }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Activity Cards Grid */}
          <motion.div
            key={activeTab}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerFast}
            initial="hidden"
            animate="visible"
          >
            {filteredActivities.map((activity) => {
              const IconComponent = activity.icon;
              const badgeStyle =
                activity.badgeColor[
                theme as "light" | "solarised" | "dark"
                ] || activity.badgeColor.light;

              return (
                <motion.div
                  key={activity.id}
                  variants={fadeUp}
                  className={`group relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${t(
                    "border-zinc-200/80 bg-white hover:shadow-xl hover:shadow-zinc-200/50",
                    "border-slate-700/60 bg-slate-800/80 hover:shadow-xl hover:shadow-slate-900/50",
                    "border-zinc-800/70 bg-zinc-900/80 hover:shadow-xl hover:shadow-zinc-950/50"
                  )}`}
                >
                  <div>
                    {/* Header: Icon + Frequency Badge */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div
                        className={`inline-flex items-center justify-center h-12 w-12 rounded-xl transition-transform duration-300 group-hover:scale-105 ${t(
                          "bg-indigo-50 text-indigo-700",
                          "bg-indigo-950/60 text-indigo-300",
                          "bg-zinc-800 text-indigo-400"
                        )}`}
                      >
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
                      >
                        <Calendar className="h-3 w-3" />
                        {activity.frequency}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className={`text-lg font-bold mb-2 tracking-tight ${t(
                        "text-zinc-900",
                        "text-slate-100",
                        "text-zinc-100"
                      )}`}
                    >
                      {activity.title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`text-sm leading-relaxed mb-5 ${t(
                        "text-zinc-600",
                        "text-slate-400",
                        "text-zinc-400"
                      )}`}
                    >
                      {activity.description}
                    </p>
                  </div>

                  {/* Timings container */}
                  <div
                    className={`pt-4 border-t ${t(
                      "border-zinc-100",
                      "border-slate-700/60",
                      "border-zinc-800/60"
                    )}`}
                  >
                    {activity.slots ? (
                      <div className="space-y-1.5">
                        <div
                          className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider mb-2 ${t(
                            "text-indigo-700",
                            "text-indigo-400",
                            "text-indigo-400"
                          )}`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          <span>Service Schedule:</span>
                        </div>
                        {activity.slots.map((slot) => (
                          <div
                            key={slot.label}
                            className={`flex items-center justify-between text-xs py-1 px-2.5 rounded-lg ${t(
                              "bg-zinc-50 text-zinc-700",
                              "bg-slate-900/60 text-slate-300",
                              "bg-zinc-950/60 text-zinc-300"
                            )}`}
                          >
                            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {slot.label}
                            </span>
                            <span className="font-mono text-[11px]">
                              {slot.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium w-full ${t(
                          "bg-zinc-50 text-zinc-700",
                          "bg-slate-900/60 text-slate-300",
                          "bg-zinc-950/60 text-zinc-300"
                        )}`}
                      >
                        <Clock className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        <span className="font-semibold">{activity.time}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Latest Live Videos & Sermons ─── */}
      <YouTubeSection />

      {/* ─── Church Info & Pastor Banner ─── */}
      <section
        className={`py-16 px-4 transition-colors duration-500 border-t border-b ${t(
          "bg-white border-zinc-200/80",
          "bg-slate-900 border-slate-800",
          "bg-zinc-950 border-zinc-800"
        )}`}
      >
        <div className="max-w-7xl mx-auto">
          <div
            className={`p-8 sm:p-10 rounded-3xl border ${t(
              "bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/50 border-indigo-100 shadow-lg",
              "bg-gradient-to-br from-slate-800/80 via-slate-900 to-indigo-950/60 border-slate-700/80 shadow-2xl",
              "bg-gradient-to-br from-zinc-900 via-zinc-950 to-black border-zinc-800 shadow-2xl"
            )}`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Pastor Info & Contact */}
              <div className="lg:col-span-6 flex flex-col justify-between h-full space-y-6">
                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3 ${t(
                      "bg-indigo-100 text-indigo-800",
                      "bg-indigo-500/20 text-indigo-300",
                      "bg-indigo-500/15 text-indigo-300"
                    )}`}
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    Senior Pastor
                  </span>
                  <h3
                    className={`text-2xl sm:text-3xl font-serif font-bold mb-2 ${t(
                      "text-indigo-950",
                      "text-white",
                      "text-zinc-50"
                    )}`}
                  >
                    Pastor. J. Eliza Dollfus
                  </h3>
                  <p
                    className={`text-sm sm:text-base leading-relaxed mb-6 ${t(
                      "text-zinc-600",
                      "text-slate-300",
                      "text-zinc-400"
                    )}`}
                  >
                    Under the spiritual guidance of Pastor J. Eliza Dollfus, Total
                    Transformation Ministries is devoted to nurturing souls,
                    fostering genuine fellowship, and reaching our community with
                    the love and power of God.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    <a
                      href="tel:+918940509330"
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] ${t(
                        "bg-white border-zinc-200 text-zinc-800 hover:border-indigo-300 shadow-xs",
                        "bg-slate-800/90 border-slate-700 text-slate-200 hover:border-indigo-500",
                        "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700"
                      )}`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <span className={`block text-[11px] font-medium ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                          Primary Contact
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          +91 89405 09330
                        </span>
                      </div>
                    </a>

                    <a
                      href="tel:+918940509331"
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all duration-200 hover:scale-[1.02] ${t(
                        "bg-white border-zinc-200 text-zinc-800 hover:border-indigo-300 shadow-xs",
                        "bg-slate-800/90 border-slate-700 text-slate-200 hover:border-indigo-500",
                        "bg-zinc-900 border-zinc-800 text-zinc-200 hover:border-zinc-700"
                      )}`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <span className={`block text-[11px] font-medium ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                          Alternate Line
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          +91 89405 09331
                        </span>
                      </div>
                    </a>
                  </div>

                  <div className="space-y-3">
                    <a
                      href="mailto:elizadollfus@gmail.com"
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-colors ${t(
                        "bg-white border-zinc-200 text-zinc-800 hover:bg-zinc-50 shadow-xs",
                        "bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-800",
                        "bg-zinc-900 border-zinc-800 text-zinc-200 hover:bg-zinc-800"
                      )}`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <span className={`block text-[11px] font-medium ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                          Email Address
                        </span>
                        <span className="text-sm font-bold tracking-tight">
                          elizadollfus@gmail.com
                        </span>
                      </div>
                    </a>

                    {/* Church Address */}
                    <div
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border ${t(
                        "bg-white border-zinc-200 text-zinc-700 shadow-xs",
                        "bg-slate-800/90 border-slate-700 text-slate-300",
                        "bg-zinc-900 border-zinc-800 text-zinc-300"
                      )}`}
                    >
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <span className={`block text-[11px] font-medium mb-0.5 ${t(
                          "text-zinc-500",
                          "text-slate-400",
                          "text-zinc-400"
                        )}`}>
                          Church Address
                        </span>
                        <p className={`text-xs leading-relaxed font-medium ${t(
                          "text-zinc-800",
                          "text-slate-200",
                          "text-zinc-200"
                        )}`}>
                          No: 1, Athikadavu Road, (Opp. Subbu Hospital), Sreenivasa Nagar,
                          Veerapandi Pirivu, Periyanaicken Palayam, Coimbatore - 641019.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Google Maps */}
              <div className="lg:col-span-6 flex flex-col space-y-4">
                <div
                  className={`p-5 rounded-2xl border ${t(
                    "bg-white/90 border-indigo-100/80 shadow-md",
                    "bg-slate-900/90 border-slate-700/80 shadow-lg",
                    "bg-zinc-950/90 border-zinc-800/80 shadow-lg"
                  )}`}
                >
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-indigo-500 shrink-0" />
                      <div>
                        <h4
                          className={`font-serif font-bold text-base ${t(
                            "text-indigo-950",
                            "text-slate-100",
                            "text-zinc-100"
                          )}`}
                        >
                          Total Transformation Center
                        </h4>
                        <span className={`text-[11px] ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                          Veerapandi Pirivu, Coimbatore
                        </span>
                      </div>
                    </div>
                    <a
                      href="https://www.google.com/maps/place/Total+Transformation+Center/@11.1718617,76.9514835,20z"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all hover:scale-105 shrink-0 ${t(
                        "bg-indigo-50 text-indigo-900 border-indigo-200 hover:bg-indigo-100",
                        "bg-indigo-600 text-white border-indigo-500 hover:bg-indigo-700",
                        "bg-zinc-100 text-zinc-900 border-white hover:bg-white"
                      )}`}
                    >
                      <Navigation className="h-3 w-3 fill-current" />
                      <span>Directions</span>
                      <ExternalLink className="h-3 w-3 opacity-60" />
                    </a>
                  </div>

                  {/* Embedded Google Map */}
                  <div className="relative w-full h-[290px] sm:h-[320px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner">
                    <iframe
                      title="Total Transformation Center Google Maps Location"
                      src="https://maps.google.com/maps?q=11.1718617,76.9514835+(Total%20Transformation%20Center)&t=&z=18&ie=UTF8&iwloc=B&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Scripture Banner ─── */}
      <section
        className={`py-20 sm:py-24 px-4 relative overflow-hidden ${t(
          "bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950",
          "bg-gradient-to-br from-slate-800 via-indigo-950 to-slate-950",
          "bg-gradient-to-br from-zinc-900 via-indigo-950 to-zinc-950"
        )}`}
      >
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 bg-indigo-800/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-900/20 rounded-full blur-3xl" />
        </div>

        <motion.div
          className="relative max-w-3xl mx-auto text-center"
          variants={staggerSlow}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
        >
          <motion.h2
            variants={fadeUp}
            className="text-2xl sm:text-3xl md:text-4xl font-serif font-bold text-white mb-6 leading-snug"
          >
            &ldquo;For I know the plans I have for you,&rdquo; declares the Lord
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="text-indigo-200 text-base sm:text-lg leading-relaxed mb-4"
          >
            &ldquo;plans to prosper you and not to harm you, plans to give you
            hope and a future.&rdquo;
          </motion.p>
          <motion.p
            variants={fadeUp}
            className="text-indigo-400 text-sm font-semibold mb-10"
          >
            — Jeremiah 29:11
          </motion.p>
          <motion.div variants={fadeUp}>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-900 font-semibold rounded-full hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
            >
              Sign In to Member Portal
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        className={`py-12 px-4 transition-colors duration-500 ${t(
          "bg-zinc-950 text-zinc-400",
          "bg-slate-950 text-slate-400",
          "bg-black text-zinc-400"
        )}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/assets/TTC Logo PNG.png"
                  alt="TTC Logo"
                  width={36}
                  height={36}
                  unoptimized
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
                <span className="font-serif font-bold text-white text-lg">
                  Total Transformation Ministries
                </span>
              </div>
              <p className="text-sm leading-relaxed max-w-sm">
                A community rooted in faith, united by love, and committed to
                seeing every life reach its God-given potential.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-4">
                Quick Links
              </h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a
                    href="#activities"
                    className="hover:text-white transition-colors"
                  >
                    All Activities &amp; Timings
                  </a>
                </li>
                <li>
                  <a
                    href="#live-services"
                    className="hover:text-white transition-colors"
                  >
                    Live Sunday Services
                  </a>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Member Portal Sign In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 mb-4">
                Contact &amp; Location
              </h4>
              <ul className="space-y-3 text-xs leading-relaxed">
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <a
                    href="https://www.google.com/maps/place/Total+Transformation+Center/@11.1718617,76.9514835,20z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white hover:underline transition-colors"
                    title="Open Total Transformation Center on Google Maps"
                  >
                    No: 1, Athikadavu Road, (Opp. Subbu Hospital) Sreenivasa
                    Nagar, Veerapandi Pirivu, Periyanaicken Palayam, Coimbatore -
                    641019.
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div className="flex flex-wrap items-center gap-x-1.5">
                    <a
                      href="tel:+918940509330"
                      className="hover:text-white hover:underline transition-colors"
                      title="Call +91 89405 09330"
                    >
                      +91 89405 09330,
                    </a>
                    <a
                      href="tel:+918940509331"
                      className="hover:text-white hover:underline transition-colors"
                      title="Call +91 89405 09331"
                    >
                      89405 09331
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                  <a
                    href="mailto:elizadollfus@gmail.com"
                    className="hover:text-white hover:underline transition-colors"
                    title="Send Email to elizadollfus@gmail.com"
                  >
                    elizadollfus@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className={`border-t pt-6 text-center text-xs ${t(
              "border-zinc-800 text-zinc-600",
              "border-slate-800 text-slate-600",
              "border-zinc-800 text-zinc-600"
            )}`}
          >
            &copy; {new Date().getFullYear()} Total Transformation
            Ministries. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
