"use client";

import Image from "next/image";
import Link from "next/link";
import AuthCard from "./auth-card";
import ThemeSwitcher from "./theme-switcher";
import { useTheme } from "./theme-provider";
import { motion, slideLeft, slideRight, scaleIn } from "./motion";

interface AuthPageProps {
  mode: "member" | "admin";
}

/**
 * Shared full-screen auth layout used by both /login and /admin.
 * Renders the branded header (logo, title, theme switcher) and the
 * centered AuthCard with the correct mode.
 */
export default function AuthPage({ mode }: AuthPageProps) {
  const { theme } = useTheme();

  const bgStyles = {
    light: "from-indigo-50 via-purple-50 to-amber-50/50",
    solarised: "from-slate-800 via-slate-900 to-indigo-950",
    dark: "from-zinc-950 via-zinc-900 to-black",
  };

  return (
    <main
      className={`relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-8 sm:p-6 transition-all duration-500 bg-gradient-to-br ${bgStyles[theme]}`}
    >
      {/* Brand logo — slides in from left */}
      <motion.div
        className="absolute top-6 left-4 sm:left-6 md:left-8"
        variants={slideLeft}
        initial="hidden"
        animate="visible"
      >
        <Link href="/">
          <Image
            src="/assets/TTC Logo PNG.png"
            alt="Total Transformation Center Logo"
            width={48}
            height={48}
            unoptimized
            className={`h-10 w-auto sm:h-12 object-contain drop-shadow-md ${
              theme === "light" ? "" : "brightness-0 invert"
            }`}
          />
        </Link>
      </motion.div>

      {/* Brand text — fades down */}
      <motion.div
        className="absolute top-8 left-1/2 -translate-x-1/2 hidden sm:block"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <span
          className={`text-lg md:text-xl font-bold tracking-tight ${
            theme === "light"
              ? "text-indigo-950"
              : theme === "solarised"
                ? "text-slate-100"
                : "text-zinc-50"
          }`}
        >
          Total Transformation Center
        </span>
      </motion.div>

      {/* Theme Switcher — slides in from right */}
      <motion.div
        className="absolute top-6 right-4 sm:right-6 md:right-8"
        variants={slideRight}
        initial="hidden"
        animate="visible"
      >
        <ThemeSwitcher />
      </motion.div>

      {/* Centered Auth Card — scales in */}
      <motion.div
        className="w-full max-w-md"
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
      >
        <AuthCard theme={theme} mode={mode} />
      </motion.div>
    </main>
  );
}
