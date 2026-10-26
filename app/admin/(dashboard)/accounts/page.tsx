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
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Landmark,
  PieChart,
  Plus,
  ReceiptText,
  Search,
  Wallet,
} from "lucide-react";
import React, { useState } from "react";

interface Transaction {
  id: string;
  date: string;
  category: string;
  type: "Credit" | "Debit";
  amount: number;
  account: string;
  status: "Cleared" | "Paid" | "Pending";
}

const initialTransactions: Transaction[] = [
  {
    id: "TX-401",
    date: "19 Oct 2026",
    category: "Sunday Service Income",
    type: "Credit",
    amount: 92400,
    account: "Main Ministry HDFC",
    status: "Cleared",
  },
  {
    id: "TX-402",
    date: "17 Oct 2026",
    category: "Auditorium Electricity & AC",
    type: "Debit",
    amount: 24500,
    account: "Utility Expenses",
    status: "Paid",
  },
  {
    id: "TX-403",
    date: "15 Oct 2026",
    category: "Livestream & Audio Cables",
    type: "Debit",
    amount: 8900,
    account: "Equipment & Sound",
    status: "Paid",
  },
  {
    id: "TX-404",
    date: "14 Oct 2026",
    category: "Community Food Outreach",
    type: "Debit",
    amount: 18000,
    account: "Benevolence Fund",
    status: "Paid",
  },
  {
    id: "TX-405",
    date: "12 Oct 2026",
    category: "Weekly Tithes & Offerings",
    type: "Credit",
    amount: 156500,
    account: "Main Ministry HDFC",
    status: "Cleared",
  },
];

export default function AccountsPage() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "Credit" | "Debit">("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form State
  const [desc, setDesc] = useState("");
  const [type, setType] = useState<"Credit" | "Debit">("Debit");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("Main Ministry HDFC");

  const t = (light: string, solarised: string, dark: string) => {
    if (theme === "light") return light;
    if (theme === "solarised") return solarised;
    return dark;
  };

  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(amount);
    if (!amountVal || amountVal <= 0 || !desc.trim()) return;

    const newTx: Transaction = {
      id: `TX-40${transactions.length + 1}`,
      date: "20 Oct 2026",
      category: desc.trim(),
      type,
      amount: amountVal,
      account,
      status: type === "Credit" ? "Cleared" : "Paid",
    };

    setTransactions([newTx, ...transactions]);
    setDesc("");
    setAmount("");
    setIsDialogOpen(false);
  };

  const filteredTx = transactions.filter((tx) => {
    const matchesSearch =
      tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.account.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif flex items-center gap-2">
            <Wallet className="h-6 w-6 text-amber-500" />
            Church Accounts &amp; Treasury
          </h1>
          <p className={`text-sm mt-1 ${t("text-zinc-600", "text-slate-400", "text-zinc-400")}`}>
            Financial transparency, disbursement logs, and ministry bank account balances.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs rounded-full h-9 px-5 py-2 transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Transaction
        </Button>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Main HDFC Current A/C</span>
            <Landmark className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-serif">₹14,58,200</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Active Operating Account</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Building Project Fund</span>
            <ReceiptText className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold font-serif">₹3,20,000</div>
          <span className="text-[11px] text-zinc-500">Fixed Reserve</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Benevolence Fund</span>
            <PieChart className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif">₹64,650</div>
          <span className="text-[11px] text-zinc-500">Poor &amp; Outreach care</span>
        </div>

        <div className={`p-5 rounded-2xl border shadow-sm space-y-2 ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold ${t("text-zinc-500", "text-slate-400", "text-zinc-400")}`}>Total Treasury Net</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-serif text-emerald-700 dark:text-emerald-400">₹18,42,850</div>
          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">Audit Ready</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl text-xs"
          />
        </div>

        <div className="w-full sm:w-44">
          <NativeSelect
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as "ALL" | "Credit" | "Debit")}
            className="text-xs h-10"
          >
            <option value="ALL">All Flows</option>
            <option value="Credit">Credits Only (Income)</option>
            <option value="Debit">Debits Only (Expense)</option>
          </NativeSelect>
        </div>
      </div>

      {/* Ledger Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${t("bg-white border-zinc-200", "bg-slate-900 border-slate-800", "bg-zinc-950 border-zinc-800")}`}>
        <Table>
          <TableHeader>
            <TableRow className={t("bg-zinc-50", "bg-slate-800/60", "bg-zinc-900/60")}>
              <TableHead className="font-bold text-xs">Tx ID</TableHead>
              <TableHead className="font-bold text-xs">Date</TableHead>
              <TableHead className="font-bold text-xs">Category / Narration</TableHead>
              <TableHead className="font-bold text-xs">Flow</TableHead>
              <TableHead className="font-bold text-xs">Ledger Account</TableHead>
              <TableHead className="font-bold text-xs text-right">Amount (₹)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTx.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="font-mono text-xs font-bold">{tx.id}</TableCell>
                <TableCell className="text-xs">{tx.date}</TableCell>
                <TableCell className="text-xs font-medium">{tx.category}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      tx.type === "Credit"
                        ? "bg-emerald-500/10 text-emerald-700 border-emerald-300 text-[10px] flex w-fit items-center gap-1"
                        : "bg-red-500/10 text-red-600 border-red-300 text-[10px] flex w-fit items-center gap-1"
                    }
                  >
                    {tx.type === "Credit" ? (
                      <ArrowDownLeft className="h-3 w-3" />
                    ) : (
                      <ArrowUpRight className="h-3 w-3" />
                    )}
                    {tx.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{tx.account}</TableCell>
                <TableCell
                  className={`text-right font-mono font-bold text-sm ${tx.type === "Credit" ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-900 dark:text-zinc-100"
                    }`}
                >
                  {tx.type === "Credit" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
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
              <ReceiptText className="h-5 w-5 text-amber-500" />
              Add Ledger Entry
            </DialogTitle>
            <DialogDescription className="text-xs">
              Record a financial disbursement or direct contribution.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddTransaction} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Category / Description *
              </label>
              <Input
                type="text"
                placeholder="e.g. Guest Speaker Honorarium, Sound Cables..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="h-10 text-sm rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Transaction Type
              </label>
              <NativeSelect value={type} onChange={(e) => setType(e.target.value as "Credit" | "Debit")}>
                <option value="Debit">Debit (Expense / Payout)</option>
                <option value="Credit">Credit (Income / Deposit)</option>
              </NativeSelect>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Amount (₹) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 15000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="h-10 text-sm rounded-xl font-mono"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Ledger Account
              </label>
              <NativeSelect value={account} onChange={(e) => setAccount(e.target.value)}>
                <option value="Main Ministry HDFC">Main Ministry HDFC</option>
                <option value="Utility Expenses">Utility Expenses</option>
                <option value="Equipment & Sound">Equipment &amp; Sound</option>
                <option value="Benevolence Fund">Benevolence Fund</option>
              </NativeSelect>
            </div>

            <DialogFooter className="pt-3 border-t border-zinc-200 dark:border-zinc-800 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="h-9 px-5 py-2 rounded-full text-sm font-semibold">
                Cancel
              </Button>
              <Button type="submit" className="h-9 px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-sm shadow-xs">
                Post Transaction
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
