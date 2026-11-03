/**
 * Common Domain and API types for Family and Members
 * Reused across backend (API routes) and frontend (React components)
 */

export type Status = "ACTIVE" | "INACTIVE";
export type FamilyStatus = Status;
export type MemberStatus = Status;

export type Gender = "MALE" | "FEMALE" | "OTHER" | "";
export type MaritalStatus = "MARRIED" | "UNMARRIED" | "DIVORCED" | "WIDOWED" | "";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";

/**
 * Shape of member data in the frontend form modals (Add & Edit pages)
 */
export interface MemberFormData {
  id: string; // UUID or temp client ID like MEM-...
  name: string;
  isHead: boolean;
  age: number | "";
  gender: string;
  bloodGroup: string;
  dob: string;
  status: Status;
  inactiveReason: string;
  maritalStatus: string;
  dateOfMarriage?: string;
  yearsOfMarriage?: number | "";
  isLookingForAlliance?: boolean;
  occupation: string;
  role: string;
  phone: string;
  email: string;
}

/**
 * Empty default state for member form
 */
export const emptyMemberForm: MemberFormData = {
  id: "",
  name: "",
  isHead: false,
  age: "",
  gender: "",
  bloodGroup: "",
  dob: "",
  status: "ACTIVE",
  inactiveReason: "",
  maritalStatus: "",
  dateOfMarriage: "",
  yearsOfMarriage: "",
  isLookingForAlliance: false,
  occupation: "",
  role: "",
  phone: "",
  email: "",
};

/**
 * Shape of family data in directory lists & detail dialogs
 */
export interface FamilyMemberItem {
  id: string;
  name: string;
  isHead: boolean;
  age: number;
  gender: string;
  phone: string;
  email: string;
  bloodGroup: string;
  dob: string;
  status: Status;
  maritalStatus: string;
  dateOfMarriage?: string;
  isLookingForAlliance?: boolean;
  occupation: string;
  role: string;
  address: string;
  is_deleted?: boolean;
}

export interface FamilyDirectoryItem {
  id: string;
  name: string;
  status: Status;
  location: string;
  region: string;
  address: string;
  memberCount: number;
  members: FamilyMemberItem[];
  is_deleted?: boolean;
}

/**
 * Payload sent to POST /api/families for creating a new member
 */
export interface CreateMemberDto {
  name: string;
  isHead: boolean;
  age?: number | string | null;
  gender?: string | null;
  bloodGroup?: string | null;
  dob?: string | null;
  status?: string | null;
  inactiveReason?: string | null;
  maritalStatus?: string | null;
  dateOfMarriage?: string | null;
  isLookingForAlliance?: boolean;
  occupation?: string | null;
  role?: string | null;
  churchRole?: string | null;
  phone?: string | null;
  email?: string | null;
  is_deleted?: boolean;
}

/**
 * Payload sent to PUT /api/families/[id] for updating a member
 */
export interface UpdateMemberDto extends CreateMemberDto {
  id?: string;
}

/**
 * Payload sent to POST /api/families
 */
export interface CreateFamilyDto {
  location?: string | null;
  region?: string | null;
  address: string;
  status?: string | null;
  inactiveReason?: string | null;
  password?: string | null;
  is_deleted?: boolean;
  members: CreateMemberDto[];
}

/**
 * Payload sent to PUT /api/families/[id]
 */
export interface UpdateFamilyDto {
  location?: string | null;
  region?: string | null;
  address?: string | null;
  status?: string | null;
  inactiveReason?: string | null;
  password?: string | null;
  is_deleted?: boolean;
  members?: UpdateMemberDto[];
}

/**
 * Shape of family member data returned by backend API (/api/families/[id])
 */
export interface ApiFamilyMember {
  id: string;
  name: string;
  is_head?: boolean;
  age?: number | null;
  dob?: string | null;
  dom?: string | null;
  gender?: string | null;
  phone?: string | null;
  email?: string | null;
  blood_group?: string | null;
  status?: string | null;
  inactive_reason?: string | null;
  marital_status?: string | null;
  is_looking_for_alliance?: boolean;
  occupation?: string | null;
  church_role?: string | null;
  role?: string | null;
  years_of_marriage?: number | null;
}

/**
 * Shape of full family record returned by backend API (/api/families/[id])
 */
export interface ApiFamilyRecord {
  id: string;
  name?: string | null;
  location?: string | null;
  region?: string | null;
  address?: string | null;
  status?: Status | string | null;
  inactive_reason?: string | null;
  members: ApiFamilyMember[];
  is_deleted?: boolean;
  created_at?: string | Date;
  updated_at?: string | Date;
}

/**
 * Standard pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Standard API responses
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: PaginationMeta;
}
