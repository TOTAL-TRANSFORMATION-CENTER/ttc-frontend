/**
 * Centralized Application Constants
 * Reused across Frontend forms, tables, modals, and Backend validation
 */

// ─── Demographics & Personal Attributes ───
export const GENDERS = [
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER", label: "Other" },
] as const;

export type GenderValue = (typeof GENDERS)[number]["value"];

export const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "O+",
  "O-",
  "AB+",
  "AB-",
  "Unknown",
] as const;

export type BloodGroupValue = (typeof BLOOD_GROUPS)[number];

export const MARITAL_STATUSES = [
  { value: "MARRIED", label: "Married" },
  { value: "UNMARRIED", label: "Unmarried / Single" },
  { value: "DIVORCED", label: "Divorced" },
  { value: "WIDOWED", label: "Widowed" },
] as const;

export type MaritalStatusValue = (typeof MARITAL_STATUSES)[number]["value"];

// ─── Church Organization ───
export const CHURCH_ROLES = [
  "General Member",
  "Pastor",
  "Elder",
  "Deacon",
  "Worship Leader",
  "Sunday School Teacher",
  "Youth Leader",
  "Audio/Visual Team",
  "Hospitality Team",
  "Choir",
] as const;

export type ChurchRoleValue = (typeof CHURCH_ROLES)[number];

export const STATUSES = ["ACTIVE", "INACTIVE"] as const;
export type StatusValue = (typeof STATUSES)[number];

export const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
] as const;

export const DEFAULT_REGION = "Karamadai";
export const DEFAULT_PAGE_LIMIT = 10;

// ─── Age Bracket Thresholds ───
export const AGE_BRACKETS = {
  CHILD: { max: 11, label: "Child" },
  PRE_YOUTH: { min: 12, max: 17, label: "Pre-Youth" },
  YOUTH: { min: 18, max: 30, label: "Youth" },
  ADULT: { min: 31, label: "Adult" },
} as const;

// ─── Offerings Categories & Modes ───
export const OFFERING_CATEGORIES = [
  "Tithe",
  "Thanksgiving",
  "General Offering",
  "Building Fund",
  "Missions & Outreach",
] as const;

export const PAYMENT_MODES = [
  "UPI / QR",
  "Cash",
  "Bank Transfer",
  "Mixed",
] as const;

// ─── Visitor & Follow-Up Stages ───
export const FOLLOW_UP_STAGES = [
  "Needs Call",
  "Called & Welcomed",
  "Home Visited",
  "Joined Fellowship",
] as const;

// ─── Account Flows ───
export const ACCOUNT_FLOWS = ["Credit", "Debit"] as const;

// ─── Administrator Roles ───
export const ADMIN_ROLES = [
  "Super Administrator",
  "Finance Admin",
  "Operations Admin",
  "Editor",
] as const;

export const ADMIN_MANAGEMENT_ROLES = [
  "SUPER ADMIN",
  "ADMIN",
  "MEMBER",
] as const;
export type AdminManagementRole = (typeof ADMIN_MANAGEMENT_ROLES)[number];

// ─── Page-Level Access Control Registry ───
// Central source-of-truth for all admin dashboard pages.
// 'key' is stored in admin.page_routes[] in the database.
// Change Password (/admin/settings) is intentionally excluded — always visible.
export const PAGE_ROUTES = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: "LayoutDashboard",
  },
  {
    key: "families",
    label: "Families",
    href: "/admin/families",
    icon: "Users",
  },
  {
    key: "offerings",
    label: "Offerings",
    href: "/admin/offerings",
    icon: "HeartHandshake",
  },
  {
    key: "accounts",
    label: "Accounts",
    href: "/admin/accounts",
    icon: "Wallet",
  },
  {
    key: "new_commers",
    label: "New Commers",
    href: "/admin/new-commers",
    icon: "UserPlus",
  },
  {
    key: "admin_management",
    label: "Admin Management",
    href: "/admin/admin-management",
    icon: "ShieldCheck",
  },
  {
    key: "dropdown_settings",
    label: "Dropdown Settings",
    href: "/admin/dropdown-settings",
    icon: "SlidersHorizontal",
  },
] as const;

export type PageRouteKey = (typeof PAGE_ROUTES)[number]["key"];

/** All page keys — convenience array for SUPER ADMIN default grants */
export const ALL_PAGE_ROUTE_KEYS: PageRouteKey[] = PAGE_ROUTES.map(
  (p) => p.key as PageRouteKey
);
