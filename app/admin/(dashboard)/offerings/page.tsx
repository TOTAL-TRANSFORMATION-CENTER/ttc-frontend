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
  HeartHandshake,
  Plus,
  QrCode,
  Receipt,
  Search,
  TrendingUp
} from "lucide-react";
import React, { useState } from "react";

interface Offering {
  id: string;
  date: string;
  service: string;
  type: string;
  donor: string;
  amount: number;
  mode: "UPI / QR" | "Cash" | "Bank Transfer" | "Mixed";
  receipt: string;
}

const initialOfferings: Offering[] = [
  {
    id: "OFF-801",
    date: "19 Oct 2026",
    service: "2nd Service (09:00 AM)",
    type: "Tithe",
    donor: "Anonymous / Confidential",
    amount: 45000,
    mode: "UPI / QR",
    receipt: "RCPT-9841",
  },
  {
    id: "OFF-802",
    date: "19 Oct 2026",
    service: "1st Service (07:00 AM)",
    type: "Thanksgiving",
    donor: "Samuel & Family",
    amount: 15000,
    mode: "Cash",
    receipt: "RCPT-9842",
  },
  {
    id: "OFF-803",
    date: "19 Oct 2026",
    service: "3rd Service (11:00 AM)",
    type: "General Offering",
    donor: "Congregation Bag Collection",
    amount: 32400,
    mode: "Cash",
    receipt: "RCPT-9843",
  },
  {
    id: "OFF-804",
    date: "18 Oct 2026",
    service: "Midweek Fasting Prayer",
    type: "Building Fund",
    donor: "Ministry Partners Group",
    amount: 50000,
    mode: "Bank Transfer",
    receipt: "RCPT-9844",
  },
  {
    id: "OFF-805",
    date: "12 Oct 2026",
    service: "Sunday All Services",
    type: "Missions & Outreach",
    donor: "TTC General Congregation",
    amount: 68500,
    mode: "Mixed",
    receipt: "RCPT-9830",
  },
];

export default function OfferingsPage() {
  const { theme } = useTheme();
  const [offerings, setOfferings] = useState<Offering[]>(initialOfferings);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [newService, setNewService] = useState("2nd Service (09:00 AM)");
  const [newType, setNewType] = useState("Tithe");
  const [newDonor, setNewDonor] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newMode, setNewMode] = useState<Offering["mode"]>("UPI / QR");

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const handleRecordOffering = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(newAmount);
    if (!amountVal || amountVal <= 0) return;

    const newEntry: Offering = {
      id: `OFF-80${offerings.length + 1}`,
      date: "20 Oct 2026",
      service: newService,
      type: newType,
      donor: newDonor.trim() || "Anonymous / Church Member",
      amount: amountVal,
      mode: newMode,
      receipt: `RCPT-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setOfferings([newEntry, ...offerings]);
    setNewAmount("");
    setNewDonor("");
    setIsDialogOpen(false);
  };

  const filteredOfferings = offerings.filter((off) => {
    const matchesSearch =
      off.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      off.receipt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      off.service.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || off.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalCollected = offerings.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-amber-500" />
            Offerings &amp; Sunday Collections
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Log and reconcile tithes, thanksgiving gifts, missions, and building funds.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs rounded-full h-9 px-5 py-2 transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Record New Offering
        </Button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Total Logged Collection</span>
          <div className="text-2xl font-bold font-serif text-amber-500">₹{totalCollected.toLocaleString("en-IN")}</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> Reconciled this period
          </span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Tithes &amp; Sacrificial Giving</span>
          <div className="text-2xl font-bold font-serif">₹1,13,500</div>
          <span className="text-[11px] text-zinc-500">46% of total Sunday collections</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Digital / UPI Share</span>
          <div className="text-2xl font-bold font-serif">64.2%</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <QrCode className="h-3 w-3" /> Direct bank deposit
          </span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Receipts Generated</span>
          <div className="text-2xl font-bold font-serif">{offerings.length}</div>
          <span className="text-[11px] text-zinc-500">All receipts digitally numbered</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search by donor or receipt..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-48">
            <NativeSelect
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              <option value="Tithe">Tithe</option>
              <option value="Thanksgiving">Thanksgiving</option>
              <option value="General Offering">General Offering</option>
              <option value="Building Fund">Building Fund</option>
              <option value="Missions & Outreach">Missions</option>
            </NativeSelect>
          </div>
        </div>
      </div>

      {/* Offerings Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
        <Table>
          <TableHeader>
            <TableRow className={t("bg-zinc-50", "bg-slate-800/60", "bg-zinc-900/60")}>
              <TableHead className="font-bold text-xs">Receipt #</TableHead>
              <TableHead className="font-bold text-xs">Date</TableHead>
              <TableHead className="font-bold text-xs">Service</TableHead>
              <TableHead className="font-bold text-xs">Category</TableHead>
              <TableHead className="font-bold text-xs">Donor</TableHead>
              <TableHead className="font-bold text-xs">Payment Mode</TableHead>
              <TableHead className="font-bold text-xs text-right">Amount (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOfferings.map((off) => (
              <TableRow key={off.id}>
                <TableCell className="font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  {off.receipt}
                </TableCell>
                <TableCell className="text-xs">{off.date}</TableCell>
                <TableCell className="text-xs font-medium">{off.service}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[10px] font-semibold">
                    {off.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{off.donor}</TableCell>
                <TableCell className="text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${t("bg-zinc-100 text-zinc-700", "bg-slate-800 text-slate-300", "bg-zinc-800 text-zinc-300")}`}>
                    {off.mode}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono font-bold text-sm">
                  ₹{off.amount.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Record Dialog */}
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
              <Receipt className="h-5 w-5 text-amber-500" />
              Record Sunday Offering
            </DialogTitle>
            <DialogDescription className="text-xs">
              Enter transaction details and amount for receipt generation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordOffering} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 5000"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="h-10 text-sm rounded-xl font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Offering Type
              </label>
              <NativeSelect value={newType} onChange={(e) => setNewType(e.target.value)}>
                <option value="Tithe">Tithe (10%)</option>
                <option value="Thanksgiving">Thanksgiving</option>
                <option value="General Offering">General Offering</option>
                <option value="Building Fund">Building Fund</option>
                <option value="Missions & Outreach">Missions & Outreach</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Service
              </label>
              <NativeSelect value={newService} onChange={(e) => setNewService(e.target.value)}>
                <option value="1st Service (07:00 AM)">1st Service (07:00 AM)</option>
                <option value="2nd Service (09:00 AM)">2nd Service (09:00 AM - Main)</option>
                <option value="3rd Service (11:00 AM)">3rd Service (11:00 AM)</option>
                <option value="Midweek Fasting Prayer">Midweek Fasting Prayer</option>
                <option value="Special Ministry Meeting">Special Ministry Meeting</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Donor Name (Leave blank for Anonymous)
              </label>
              <Input
                type="text"
                placeholder="e.g. David Samuel / Anonymous"
                value={newDonor}
                onChange={(e) => setNewDonor(e.target.value)}
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Mode of Payment
              </label>
              <NativeSelect
                value={newMode}
                onChange={(e) => setNewMode(e.target.value as Offering["mode"])}
              >
                <option value="UPI / QR">UPI / QR Code</option>
                <option value="Cash">Cash in Envelope</option>
                <option value="Bank Transfer">Bank Transfer / NEFT</option>
                <option value="Mixed">Mixed Modes</option>
              </NativeSelect>
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 px-5 py-2 rounded-full text-sm font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs">
                Record &amp; Issue Receipt
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
