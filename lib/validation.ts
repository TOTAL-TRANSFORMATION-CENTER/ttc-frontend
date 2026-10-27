import { parseDateString } from "./utils";
import type { CreateFamilyDto, CreateMemberDto, UpdateFamilyDto, UpdateMemberDto } from "@/types";

export interface ValidationResult<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

/**
 * Validates mandatory fields for a single family member.
 * Checks: name, dob, gender, bloodGroup, maritalStatus, dateOfMarriage (if married), role, phone, inactiveReason (if inactive).
 */
export function validateMemberFields(
  member: Partial<CreateMemberDto | UpdateMemberDto>,
  index: number
): { isValid: boolean; error?: string } {
  const identifier = member.name?.trim() ? `"${member.name.trim()}"` : `#${index + 1}`;

  if (!member.name || !member.name.trim()) {
    return { isValid: false, error: `Member ${identifier}: Name is required.` };
  }

  if (!member.dob || !String(member.dob).trim()) {
    return { isValid: false, error: `Member ${identifier}: Date of Birth is required.` };
  }

  const parsedDob = parseDateString(String(member.dob));
  if (!parsedDob) {
    return {
      isValid: false,
      error: `Member ${identifier}: Date of Birth must be a valid date (DD-MM-YYYY or YYYY-MM-DD).`,
    };
  }

  if (parsedDob > new Date()) {
    return {
      isValid: false,
      error: `Member ${identifier}: Date of Birth cannot be in the future.`,
    };
  }

  if (!member.gender || !String(member.gender).trim()) {
    return { isValid: false, error: `Member ${identifier}: Gender is required.` };
  }

  if (!member.bloodGroup || !String(member.bloodGroup).trim()) {
    return { isValid: false, error: `Member ${identifier}: Blood Group is required.` };
  }

  if (!member.maritalStatus || !String(member.maritalStatus).trim()) {
    return { isValid: false, error: `Member ${identifier}: Marital Status is required.` };
  }

  if (member.maritalStatus === "MARRIED") {
    if (!member.dateOfMarriage || !String(member.dateOfMarriage).trim()) {
      return {
        isValid: false,
        error: `Member ${identifier}: Date of Marriage is required for married members.`,
      };
    }

    const parsedDom = parseDateString(String(member.dateOfMarriage));
    if (!parsedDom) {
      return {
        isValid: false,
        error: `Member ${identifier}: Date of Marriage must be a valid date.`,
      };
    }
  }

  if (!member.role || !String(member.role).trim()) {
    return {
      isValid: false,
      error: `Member ${identifier}: Ministry / Church Role is required.`,
    };
  }

  if (!member.phone || !String(member.phone).trim()) {
    return {
      isValid: false,
      error: `Member ${identifier}: Phone Number is required.`,
    };
  }

  if (member.status === "INACTIVE" && (!member.inactiveReason || !member.inactiveReason.trim())) {
    return {
      isValid: false,
      error: `Member ${identifier}: Inactive reason is required when status is INACTIVE.`,
    };
  }

  return { isValid: true };
}

/**
 * Validates CreateFamilyDto payload for POST /api/families
 * Ensures all frontend mandatory fields are strictly present before writing to DB.
 */
export function validateCreateFamilyPayload(
  payload: unknown
): ValidationResult<CreateFamilyDto> {
  if (!payload || typeof payload !== "object") {
    return { isValid: false, error: "Invalid JSON request body." };
  }

  const dto = payload as Partial<CreateFamilyDto>;

  // Family Address
  if (!dto.address || !dto.address.trim()) {
    return { isValid: false, error: "Family Address is required." };
  }

  // Members list
  if (!dto.members || !Array.isArray(dto.members) || dto.members.length === 0) {
    return { isValid: false, error: "At least one family member is required." };
  }

  // Must have a designated Family Head
  const hasHead = dto.members.some((m) => m && m.isHead);
  if (!hasHead) {
    return {
      isValid: false,
      error: "At least one member must be designated as Family Head.",
    };
  }

  // Validate each member
  for (let i = 0; i < dto.members.length; i++) {
    const memberValidation = validateMemberFields(dto.members[i], i);
    if (!memberValidation.isValid) {
      return { isValid: false, error: memberValidation.error };
    }
  }

  return { isValid: true, data: dto as CreateFamilyDto };
}

/**
 * Validates UpdateFamilyDto payload for PUT /api/families/[id]
 */
export function validateUpdateFamilyPayload(
  payload: unknown
): ValidationResult<UpdateFamilyDto> {
  if (!payload || typeof payload !== "object") {
    return { isValid: false, error: "Invalid JSON request body." };
  }

  const dto = payload as Partial<UpdateFamilyDto>;

  // If address is supplied in update, it cannot be empty
  if (dto.address !== undefined && (!dto.address || !dto.address.trim())) {
    return { isValid: false, error: "Family Address cannot be empty." };
  }

  // If members array is supplied in update
  if (dto.members !== undefined) {
    if (!Array.isArray(dto.members) || dto.members.length === 0) {
      return { isValid: false, error: "A family must have at least one member." };
    }

    const hasHead = dto.members.some((m) => m && m.isHead);
    if (!hasHead) {
      return {
        isValid: false,
        error: "At least one member must be designated as Family Head.",
      };
    }

    for (let i = 0; i < dto.members.length; i++) {
      const memberValidation = validateMemberFields(dto.members[i], i);
      if (!memberValidation.isValid) {
        return { isValid: false, error: memberValidation.error };
      }
    }
  }

  return { isValid: true, data: dto as UpdateFamilyDto };
}
