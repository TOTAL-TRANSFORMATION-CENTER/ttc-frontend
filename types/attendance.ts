/**
 * Common Domain and API types for Attendance & Feature Settings
 * Reused across backend (API routes), common components, and admin/public pages
 */

// ─── SERVICES & PORTAL MODE ───

export type AttendancePortalMode = "AUTOMATIC" | "FORCE_OPEN" | "FORCE_CLOSED";

export interface AttendanceServiceOption {
  code: string;
  label: string;
  shortLabel: string;
  time?: string;
}

// Backward-compatibility alias
export type ServiceOption = AttendanceServiceOption;

// ─── PORTAL STATUS ───

export interface AttendancePortalStatus {
  isOpen: boolean;
  mode: AttendancePortalMode;
  serviceDate: string; // YYYY-MM-DD
  currentTimeIST: string; // HH:mm:ss AM/PM
  defaultService: string;
  isSunday: boolean;
  politeMessage?: string;
  services?: AttendanceServiceOption[];
}

// Backward-compatibility alias
export type PortalStatus = AttendancePortalStatus;

// ─── FAMILY SEARCH & CHECKLIST (PUBLIC & ADMIN CHECK-IN) ───

export interface AttendanceMemberChecklistItem {
  id: string;
  name: string;
  isHead: boolean;
  gender: string | null;
  age: number | null;
  phone: string | null;
  churchRole: string | null;
  alreadyAttended: boolean;
  attendedService: string | null;
  attendedAt: string | null;
  attendedAtFormatted?: string | null;
}

// Backward-compatibility alias
export type FamilyMember = AttendanceMemberChecklistItem;
export type FamilyMemberAttendance = AttendanceMemberChecklistItem;

export interface AttendanceFamilyResult {
  familyId: string;
  familyName: string;
  headName: string;
  headPhone: string | null;
  region: string | null;
  address: string | null;
  totalMembersCount: number;
  alreadyAttendedCount: number;
  members: AttendanceMemberChecklistItem[];
}

// Backward-compatibility alias
export type FamilyResult = AttendanceFamilyResult;

// ─── CHECK-IN SUBMISSIONS (POST /api/attendance) ───

export interface AttendanceSubmissionItem {
  memberId: string;
  service: string;
  notes?: string;
}

export interface AttendanceCheckinPayload {
  familyId?: string;
  attendanceDate?: string;
  submissions: AttendanceSubmissionItem[];
}

export interface SkippedMemberAttendance {
  memberId: string;
  name: string;
  service: string;
  submittedAt?: string | null;
  submittedAtFormatted?: string | null;
}

// Backward-compatibility alias
export type AlreadySubmittedMember = SkippedMemberAttendance;

export interface RecordedMemberAttendance {
  id: string;
  name: string;
  service: string;
}

export interface AttendanceCheckinResponse {
  success: boolean;
  isAlreadySubmitted?: boolean;
  message: string;
  recordedCount: number;
  skippedCount: number;
  batchId?: string;
  recordedMembers?: RecordedMemberAttendance[];
  skippedMembers?: SkippedMemberAttendance[];
  contactPhone?: string;
  contactHelp?: string;
}

export interface AlreadySubmittedAttendanceData {
  message: string;
  skippedMembers: SkippedMemberAttendance[];
  contactPhone: string;
  contactHelp?: string;
}

// Backward-compatibility alias
export type AlreadySubmittedData = AlreadySubmittedAttendanceData;

// ─── ROSTER & CALENDAR DRILLDOWN (ADMIN) ───

export interface AttendanceRosterMember {
  id: string;
  memberId: string;
  memberName: string;
  gender: string | null;
  age: number | null;
  phone: string | null;
  churchRole: string | null;
  familyId: string | null;
  familyName: string;
  region: string | null;
  service: string;
  submittedVia: string;
  batchId?: string | null;
  createdAt: string;
  notes?: string | null;
}

// Backward-compatibility aliases
export type RosterMember = AttendanceRosterMember;
export type AttendanceItem = AttendanceRosterMember;

export interface AttendanceCalendarDateSummary {
  total: number;
  uniqueFamilies: number;
  services: Record<string, number>;
}

export interface AttendanceCalendarMonthData {
  month: string; // YYYY-MM
  dates: Record<string, AttendanceCalendarDateSummary>;
}

// Backward-compatibility alias
export type CalendarMonthData = AttendanceCalendarMonthData;

// ─── ANALYTICS & PAGINATED LIST (ADMIN) ───

export interface AttendanceDemographicsStats {
  male: number;
  female: number;
  adults: number;
  youth: number;
  preYouth: number;
  children: number;
}

export interface AttendanceAnalyticsStats {
  totalPresent: number;
  uniqueFamilies: number;
  services: Record<string, number>;
  demographics: AttendanceDemographicsStats;
}

export interface AttendanceAnalyticsPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AttendanceAnalyticsData {
  stats: AttendanceAnalyticsStats;
  pagination: AttendanceAnalyticsPagination;
  data: AttendanceRosterMember[];
  date: string;
  service?: string;
}

// ─── ADMIN EDIT & DELETE ACTIONS ───

export interface AttendanceEditPayload {
  attendanceId: string;
  service: string;
  notes?: string;
}

// ─── FEATURE SETTINGS ───

export type FeatureTabKey = "attendance" | "portals" | "giving" | "communications";

