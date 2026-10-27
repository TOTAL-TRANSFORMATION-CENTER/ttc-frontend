/**
 * Shared Types for Dashboard Features (Offerings, Accounts, Visitors, Admin Management)
 */
import type {
  OFFERING_CATEGORIES,
  PAYMENT_MODES,
  FOLLOW_UP_STAGES,
  ACCOUNT_FLOWS,
  ADMIN_ROLES,
} from "@/constants";

export interface Offering {
  id: string;
  date: string;
  service: string;
  type: (typeof OFFERING_CATEGORIES)[number] | string;
  donor: string;
  amount: number;
  mode: (typeof PAYMENT_MODES)[number];
  receipt: string;
}

export interface Transaction {
  id: string;
  date: string;
  category: string;
  type: (typeof ACCOUNT_FLOWS)[number];
  amount: number;
  account: string;
  status: "Cleared" | "Paid" | "Pending";
}

export interface NewComer {
  id: string;
  name: string;
  phone: string;
  visitDate: string;
  service: string;
  heardFrom: string;
  prayerNeed: string;
  status: (typeof FOLLOW_UP_STAGES)[number];
  assignedTo: string;
}

export interface AdminUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: (typeof ADMIN_ROLES)[number] | string;
  permissions?: string;
  lastLogin?: string;
}

export interface CreateAdminDto {
  memberId: string;
  role: string;
  password: string;
}

export interface UpdateAdminDto {
  role?: string;
  isActive?: boolean;
  password?: string;
}

export interface MemberOption {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  gender: string | null;
  age: number | null;
  churchRole: string | null;
  bloodGroup: string | null;
  maritalStatus: string | null;
  status: string | null;
  isHead: boolean;
  familyAddress: string | null;
  familyRegion: string | null;
  hasAdminAccount: boolean;
  adminRole?: string | null;
}
