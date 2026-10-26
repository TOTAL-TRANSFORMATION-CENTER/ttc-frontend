"use client";

import { useTheme } from "@/components/ttc/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Key,
  Lock,
  Plus,
  ShieldCheck
} from "lucide-react";
import React, { useState } from "react";

interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  permissions: string;
  lastLogin: string;
}

const initialAdmins: AdminUser[] = [
  {
    id: "ADM-01",
    name: "Senior Pastor",
    phone: "+91 98765 00001",
    email: "pastor@ttc.org",
    role: "Super Administrator",
    permissions: "Full System Access, Financials, User Roles",
    lastLogin: "Active Now",
  },
  {
    id: "ADM-02",
    name: "Administrative Secretary",
    phone: "+91 98765 00002",
    email: "admin@ttc.org",
    role: "Operations Admin",
    permissions: "Members, New Comers, Service Schedules",
    lastLogin: "2 hours ago",
  },
  {
    id: "ADM-03",
    name: "Finance Trustee",
    phone: "+91 98765 00003",
    email: "finance@ttc.org",
    role: "Finance Admin",
    permissions: "Offerings, Accounts, Financial Reports",
    lastLogin: "Yesterday",
  },
  {
    id: "ADM-04",
    name: "Media Coordinator",
    phone: "+91 98765 00004",
    email: "media@ttc.org",
    role: "Media & Stream Admin",
    permissions: "Livestream, YouTube Integration, Announcements",
    lastLogin: "3 days ago",
  },
];

export default function AdminManagementPage() {
  const { theme } = useTheme();
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Operations Admin");

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    let permissions = "Standard Admin Permissions";
    if (role === "Super Administrator") permissions = "Full System Access & Financials";
    if (role === "Finance Admin") permissions = "Offerings, Treasury, Accounts";
    if (role === "Operations Admin") permissions = "Families, Members, New Comers";

    const newAdmin: AdminUser = {
      id: `ADM-0${admins.length + 1}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, ".")}@ttc.org`,
      role,
      permissions,
      lastLogin: "Just Created",
    };

    setAdmins([...admins, newAdmin]);
    setName("");
    setPhone("");
    setEmail("");
    setIsDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-amber-500" />
            Admin Management &amp; Role Security
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Manage pastoral staff credentials, permission levels, and secure system access.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs rounded-full h-9 px-5 py-2 transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Administrator
        </Button>
      </div>

      {/* Security Status Notice */}
      <div
        className={`p-5 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 ${t(
          "bg-amber-500/10 border-amber-300 text-zinc-900",
          "bg-amber-500/15 border-amber-500/30 text-slate-100",
          "bg-amber-500/10 border-amber-500/20 text-zinc-100"
        )}`}
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Static Master Bypass Active</h3>
            <p className={`text-xs ${t("text-zinc-700", "text-slate-300", "text-zinc-300")}`}>
              Access to /admin is currently guarded by master static PIN verification (12345).
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-amber-500 text-zinc-950 text-xs font-bold uppercase tracking-wider shrink-0">
          Super Admin Session
        </span>
      </div>

      {/* Admins Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
        <Table>
          <TableHeader>
            <TableRow className={t("bg-zinc-50", "bg-slate-800/60", "bg-zinc-900/60")}>
              <TableHead className="font-bold text-xs">Admin ID</TableHead>
              <TableHead className="font-bold text-xs">Name</TableHead>
              <TableHead className="font-bold text-xs">Contact</TableHead>
              <TableHead className="font-bold text-xs">Role</TableHead>
              <TableHead className="font-bold text-xs hidden md:table-cell">Permissions Scope</TableHead>
              <TableHead className="font-bold text-xs">Status / Last Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {admins.map((adm) => (
              <TableRow key={adm.id}>
                <TableCell className="font-mono text-xs font-bold">{adm.id}</TableCell>
                <TableCell className="font-semibold text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-amber-500/20 text-amber-600 font-bold flex items-center justify-center text-xs">
                      {adm.name.charAt(0)}
                    </div>
                    {adm.name}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  <span className="block font-mono">{adm.phone}</span>
                  <span className={`text-[11px] ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>{adm.email}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      adm.role === "Super Administrator"
                        ? "bg-amber-500 text-zinc-950 font-bold text-[10px] hover:bg-amber-400"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-[10px]"
                    }
                  >
                    {adm.role}
                  </Badge>
                </TableCell>
                <TableCell className={`text-xs hidden md:table-cell max-w-[220px] truncate ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
                  {adm.permissions}
                </TableCell>
                <TableCell>
                  <span className="text-xs font-medium flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {adm.lastLogin}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent
          className={`max-w-md ${t(
            "bg-white border-zinc-200 text-zinc-900",
            "bg-slate-900 border-slate-700 text-slate-100",
            "bg-zinc-950 border-zinc-800 text-zinc-100"
          )}`}
        >
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-serif flex items-center gap-2">
              <Key className="h-5 w-5 text-amber-500" />
              Provision Administrator Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Assign administrative rights and credentials to church staff.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAdmin} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Full Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Pastor David Samuel"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Phone Number *
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 00005"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-sm rounded-xl font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="staff@ttc.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Administrative Role
              </label>
              <NativeSelect value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="Operations Admin">Operations Admin (Families, Members, New Comers)</option>
                <option value="Finance Admin">Finance Admin (Offerings, Treasury, Accounts)</option>
                <option value="Media & Stream Admin">Media &amp; Stream Admin</option>
                <option value="Super Administrator">Super Administrator (Full System Access)</option>
              </NativeSelect>
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 px-5 py-2 rounded-full text-sm font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs">
                Create Admin User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
