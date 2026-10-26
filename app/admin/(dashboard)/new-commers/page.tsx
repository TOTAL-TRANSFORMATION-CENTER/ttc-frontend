"use client";

import { useTheme } from "@/components/ttc/theme-provider";
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
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Clock,
  Home,
  Plus,
  Search,
  Sparkles,
  UserPlus,
  Users
} from "lucide-react";
import React, { useState } from "react";

interface NewComer {
  id: string;
  name: string;
  phone: string;
  visitDate: string;
  service: string;
  heardFrom: string;
  prayerNeed: string;
  status: "Needs Call" | "Called & Welcomed" | "Home Visited" | "Joined Fellowship";
  assignedTo: string;
}

const initialNewComers: NewComer[] = [
  {
    id: "NC-101",
    name: "Solomon Raj",
    phone: "+91 97890 12345",
    visitDate: "19 Oct 2026",
    service: "2nd Service (9 AM)",
    heardFrom: "YouTube Livestream",
    prayerNeed: "Job transition & family healing",
    status: "Needs Call",
    assignedTo: "Pastor David",
  },
  {
    id: "NC-102",
    name: "Priya & Anand",
    phone: "+91 98405 67890",
    visitDate: "19 Oct 2026",
    service: "1st Service (7 AM)",
    heardFrom: "Invited by Neighbor",
    prayerNeed: "Newborn baby blessing",
    status: "Called & Welcomed",
    assignedTo: "Sister Grace",
  },
  {
    id: "NC-103",
    name: "Karthik Wilson",
    phone: "+91 99620 43210",
    visitDate: "12 Oct 2026",
    service: "3rd Service (11 AM)",
    heardFrom: "Walk-in / Billboard",
    prayerNeed: "Spiritual guidance & baptism interest",
    status: "Home Visited",
    assignedTo: "Elder Joshua",
  },
  {
    id: "NC-104",
    name: "Rachel Mary",
    phone: "+91 94440 98765",
    visitDate: "05 Oct 2026",
    service: "Sunday School Parent",
    heardFrom: "Children Ministry",
    prayerNeed: "Children education & health",
    status: "Joined Fellowship",
    assignedTo: "Sister Ruth",
  },
];

export default function NewCommersPage() {
  const { theme } = useTheme();
  const [newComers, setNewComers] = useState<NewComer[]>(initialNewComers);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState("2nd Service (9:00 AM)");
  const [heardFrom, setHeardFrom] = useState("Friend / Family");
  const [prayerNeed, setPrayerNeed] = useState("");
  const [assignedTo, setAssignedTo] = useState("Pastor David");

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const handleAddVisitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const newVisitor: NewComer = {
      id: `NC-10${newComers.length + 1}`,
      name: name.trim(),
      phone: phone.trim(),
      visitDate: "20 Oct 2026",
      service,
      heardFrom,
      prayerNeed: prayerNeed.trim() || "Prayer for blessing & guidance",
      status: "Needs Call",
      assignedTo,
    };

    setNewComers([newVisitor, ...newComers]);
    setName("");
    setPhone("");
    setPrayerNeed("");
    setIsDialogOpen(false);
  };

  const handleStatusChange = (id: string, newStatus: NewComer["status"]) => {
    setNewComers(
      newComers.map((nc) => (nc.id === id ? { ...nc, status: newStatus } : nc))
    );
  };

  const filteredVisitors = newComers.filter((nc) => {
    const matchesSearch =
      nc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nc.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      nc.prayerNeed.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || nc.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-amber-500" />
            New Comers &amp; First-Time Guests
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Pastoral follow-up care, welcoming calls, home visits, and discipleship integration.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs rounded-full h-9 px-5 py-2 transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add First-Time Visitor
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Total Guests Tracked</span>
            <Users className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif">{newComers.length}</div>
          <span className="text-[11px] text-zinc-500">Recorded this quarter</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Awaiting Pastoral Call</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-600 dark:text-amber-400">
            {newComers.filter((nc) => nc.status === "Needs Call").length}
          </div>
          <span className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Priority 24-hr follow-up</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Home Visited</span>
            <Home className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold font-serif">
            {newComers.filter((nc) => nc.status === "Home Visited").length}
          </div>
          <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Pastoral team outreach</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Joined Fellowship</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-400">
            {newComers.filter((nc) => nc.status === "Joined Fellowship").length}
          </div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Active regular members</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search by visitor name or prayer need..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs"
          />
        </div>

        <div className="w-full sm:w-56">
          <NativeSelect
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs h-10"
          >
            <option value="ALL">All Follow-up Stages</option>
            <option value="Needs Call">Needs Call</option>
            <option value="Called & Welcomed">Called &amp; Welcomed</option>
            <option value="Home Visited">Home Visited</option>
            <option value="Joined Fellowship">Joined Fellowship</option>
          </NativeSelect>
        </div>
      </div>

      {/* Visitors Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
        <Table>
          <TableHeader>
            <TableRow className={t("bg-zinc-50", "bg-slate-800/60", "bg-zinc-900/60")}>
              <TableHead className="font-bold text-xs">Guest Name</TableHead>
              <TableHead className="font-bold text-xs">Phone</TableHead>
              <TableHead className="font-bold text-xs">Visit Date</TableHead>
              <TableHead className="font-bold text-xs hidden md:table-cell">Heard From</TableHead>
              <TableHead className="font-bold text-xs hidden lg:table-cell">Prayer Request</TableHead>
              <TableHead className="font-bold text-xs">Care Status</TableHead>
              <TableHead className="font-bold text-xs">Assigned Minister</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVisitors.map((nc) => (
              <TableRow key={nc.id}>
                <TableCell className="font-semibold text-sm">
                  {nc.name}
                  <span className={`block text-[11px] font-normal ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>
                    {nc.service}
                  </span>
                </TableCell>
                <TableCell className="text-xs font-mono">{nc.phone}</TableCell>
                <TableCell className="text-xs">{nc.visitDate}</TableCell>
                <TableCell className="text-xs hidden md:table-cell">{nc.heardFrom}</TableCell>
                <TableCell className={`text-xs hidden lg:table-cell max-w-[200px] truncate ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
                  {nc.prayerNeed}
                </TableCell>
                <TableCell>
                  <NativeSelect
                    value={nc.status}
                    onChange={(e) => handleStatusChange(nc.id, e.target.value as NewComer["status"])}
                    className="h-8 text-[11px] w-40"
                  >
                    <option value="Needs Call">Needs Call</option>
                    <option value="Called & Welcomed">Called &amp; Welcomed</option>
                    <option value="Home Visited">Home Visited</option>
                    <option value="Joined Fellowship">Joined Fellowship</option>
                  </NativeSelect>
                </TableCell>
                <TableCell className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  {nc.assignedTo}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Register Visitor Dialog */}
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
              <Sparkles className="h-5 w-5 text-amber-500" />
              Register First-Time Guest
            </DialogTitle>
            <DialogDescription className="text-xs">
              Log guest contact details for pastoral warm welcome and blessing.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddVisitor} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Visitor Full Name *
              </label>
              <Input
                type="text"
                placeholder="e.g. Solomon Raj"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Mobile / WhatsApp Number *
              </label>
              <Input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-10 text-sm rounded-xl font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Service Attended
              </label>
              <NativeSelect value={service} onChange={(e) => setService(e.target.value)}>
                <option value="1st Service (7:00 AM)">1st Service (7:00 AM)</option>
                <option value="2nd Service (9:00 AM)">2nd Service (9:00 AM - Main)</option>
                <option value="3rd Service (11:00 AM)">3rd Service (11:00 AM)</option>
                <option value="Sunday School / Youth">Sunday School / Youth</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                How did they hear about TTC?
              </label>
              <NativeSelect value={heardFrom} onChange={(e) => setHeardFrom(e.target.value)}>
                <option value="Friend / Family Invitation">Friend / Family Invitation</option>
                <option value="YouTube Livestream">YouTube Livestream</option>
                <option value="Social Media (Instagram/Facebook)">Social Media</option>
                <option value="Walk-in / Church Signboard">Walk-in / Church Signboard</option>
                <option value="Special Event / Concert">Special Event / Concert</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Prayer Request / Needs
              </label>
              <Textarea
                placeholder="Family blessing, healing, job interview..."
                value={prayerNeed}
                onChange={(e) => setPrayerNeed(e.target.value)}
                className="rounded-xl min-h-[70px] text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Assign Follow-up To
              </label>
              <NativeSelect value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                <option value="Pastor David">Pastor David</option>
                <option value="Sister Grace">Sister Grace</option>
                <option value="Elder Joshua">Elder Joshua</option>
                <option value="Sister Ruth">Sister Ruth</option>
                <option value="Youth Team Leader">Youth Team Leader</option>
              </NativeSelect>
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 px-5 py-2 rounded-full text-sm font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs">
                Save &amp; Schedule Follow-up
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
