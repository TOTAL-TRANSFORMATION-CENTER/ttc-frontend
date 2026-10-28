"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@/components/ttc/theme-provider";
import { useCurrentUser, setCachedUser, getInitials } from "@/hooks/use-auth";
import { BannerAlert } from "@/components/ui/banner-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";

export default function AdminSettingsPage() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading } = useCurrentUser();
  const isUserLoading = isLoading || !currentUser?.name;

  // Form states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility toggles
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const initials = getInitials(currentUser?.name);

  // Live password validation checks
  const hasMinLength = newPassword.length >= 6;
  const isDifferentFromCurrent =
    newPassword.length > 0 && currentPassword.length > 0
      ? newPassword !== currentPassword
      : false;
  const passwordsMatch =
    newPassword.length > 0 && confirmPassword.length > 0
      ? newPassword === confirmPassword
      : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!currentPassword.trim()) {
      setErrorMsg("Please enter your current password.");
      return;
    }

    if (!newPassword.trim()) {
      setErrorMsg("Please enter a new password.");
      return;
    }

    if (newPassword.trim().length < 6) {
      setErrorMsg("New password must be at least 6 characters long.");
      return;
    }

    if (!confirmPassword.trim()) {
      setErrorMsg("Please re-enter your new password to confirm.");
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setErrorMsg("New password and confirmation password do not match.");
      return;
    }

    if (newPassword.trim() === currentPassword.trim()) {
      setErrorMsg("New password cannot be the same as your current password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: currentPassword.trim(),
          newPassword: newPassword.trim(),
          confirmPassword: confirmPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || "Failed to update password. Please verify your current password.");
        setIsSubmitting(false);
        return;
      }

      // Update cached user session so reminder banner instantly disappears
      if (data.user) {
        setCachedUser(data.user);
      }
      await queryClient.invalidateQueries({ queryKey: ["currentUser"] });

      // Reset form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setSuccessMsg(
        "Your password has been changed successfully."
      );
    } catch (err) {
      console.error("Change password error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Unable to reach the server. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-zinc-200/80 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[11px] uppercase tracking-wider border border-amber-500/20">
              Security &amp; Credentials
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight font-serif mt-1">
            Change Password
          </h1>
          <p className={`text-xs sm:text-sm mt-0.5 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Update your administrator account password with a strong combination of characters.
          </p>
        </div>
      </div>

      {/* ─── Urgent Reset Alert if isReset is true ─── */}
      {currentUser?.isReset && (
        <div
          className={`rounded-2xl p-4 sm:p-5 border flex items-start gap-3.5 shadow-sm transition-all ${t(
            "bg-amber-50 border-amber-200 text-amber-950",
            "bg-amber-950/40 border-amber-600/40 text-amber-200",
            "bg-amber-950/30 border-amber-500/30 text-amber-200"
          )}`}
        >
          <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Action Required: Reset Generated Password</h4>
            <p className="text-xs sm:text-sm leading-relaxed">
              Your administrator account was created or updated with a temporary system-generated password.
              Please change your password using the form below to secure your access.
            </p>
          </div>
        </div>
      )}

      {/* ─── Main Content Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Change Password Form (2 Columns) */}
        <div className="lg:col-span-2">
          <Card
            className={`border shadow-sm rounded-2xl ${t(
              "bg-white border-zinc-200/80",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">Change Password</CardTitle>
                  <CardDescription className="text-xs">
                    Update your account password with a strong combination of characters.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {errorMsg && (
                <div className="mb-4">
                  <BannerAlert
                    variant="error"
                    title="Password Update Failed"
                    message={errorMsg}
                    onClose={() => setErrorMsg("")}
                  />
                </div>
              )}

              {successMsg && (
                <div className="mb-4">
                  <BannerAlert
                    variant="success"
                    title="Success!"
                    message={successMsg}
                    onClose={() => setSuccessMsg("")}
                  />
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center justify-between">
                    <span>Current Password</span>
                    <span className="text-[11px] font-normal text-zinc-500">Required</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showCurrent ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="pr-10 h-10 text-sm"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(!showCurrent)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center justify-between">
                    <span>New Password</span>
                    <span className="text-[11px] font-normal text-zinc-500">Min. 6 characters</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showNew ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="pr-10 h-10 text-sm"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold flex items-center justify-between">
                    <span>Re-enter New Password</span>
                    <span className="text-[11px] font-normal text-zinc-500">Must match</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="pr-10 h-10 text-sm"
                      required
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Live Requirements Check */}
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${t(
                    "bg-zinc-50 border-zinc-200/80 text-zinc-600",
                    "bg-slate-950/60 border-slate-800 text-slate-300",
                    "bg-zinc-900/60 border-zinc-800 text-zinc-300"
                  )}`}
                >
                  <span className="font-bold text-[11px] uppercase tracking-wider block mb-1">
                    Password Requirements:
                  </span>
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${hasMinLength
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span>At least 6 characters</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${isDifferentFromCurrent
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span>Different from current password</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div
                      className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${passwordsMatch
                        ? "bg-emerald-500 text-zinc-950"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400"
                        }`}
                    >
                      <Check className="h-2.5 w-2.5" />
                    </div>
                    <span>New passwords match exactly</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right: Administrator Profile Card (1 Column) */}
        <div>
          <Card
            className={`border shadow-sm rounded-2xl h-full flex flex-col justify-between ${t(
              "bg-white border-zinc-200/80",
              "bg-slate-900 border-slate-800",
              "bg-zinc-950 border-zinc-800"
            )}`}
          >
            <div>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <User className="h-4 w-4 text-amber-500" />
                  Administrator Profile
                </CardTitle>
                <CardDescription className="text-xs">
                  Your active verified credentials in this session.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Avatar & Name */}
                {isUserLoading ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 select-none">
                    <div className="h-11 w-11 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                      <div className="h-5 w-5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                    </div>
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
                      <div className="h-2.5 w-20 rounded bg-zinc-200/60 dark:bg-zinc-850 animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="h-11 w-11 rounded-full bg-amber-500 text-zinc-950 font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-sm truncate" title={currentUser?.name}>
                        {currentUser?.name}
                      </span>
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        {currentUser?.role || "ADMIN"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Profile Details List */}
                <div className="space-y-2.5 text-xs">
                  {currentUser?.email && (
                    <div className="flex items-center gap-2.5">
                      <Mail className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="truncate text-zinc-600 dark:text-zinc-300">
                        {currentUser.email}
                      </span>
                    </div>
                  )}

                  {currentUser?.phone && (
                    <div className="flex items-center gap-2.5">
                      <Phone className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {currentUser.phone}
                      </span>
                    </div>
                  )}

                  {currentUser?.churchRole && (
                    <div className="flex items-center gap-2.5">
                      <Shield className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <span className="text-zinc-600 dark:text-zinc-300">
                        {currentUser.churchRole}
                      </span>
                    </div>
                  )}

                  {/* Password Status Badge */}
                  <div className="pt-2 border-t border-zinc-200/80 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-500 text-[11px]">Password Status</span>
                      {currentUser?.isReset ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                          Needs Reset
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          Secured
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>

            <CardFooter className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                <span>Protected with bcrypt HMAC pepper and 12-hour session keys.</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
