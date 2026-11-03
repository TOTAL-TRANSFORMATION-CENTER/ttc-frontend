/**
 * Master Data Category & Category Value Types
 * Reused across backend (API routes), hooks, and frontend (React components)
 */

// ─── DOMAIN / API ITEMS ───

export interface CategoryValueItem {
  id: number | string;
  categoryId: number | string;
  code: string;
  label: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryItem {
  id: number | string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  valuesCount?: number;
  values?: CategoryValueItem[];
}

// ─── DATABASE / PRISMA RAW SHAPES ───

export interface DbCategoryValue {
  id: bigint;
  category_id: bigint;
  code: string;
  label: string;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
}

export interface DbCategory {
  id: bigint;
  code: string;
  name: string;
  description: string | null;
  created_at: Date;
  _count?: { category_values: number };
  category_values?: DbCategoryValue[];
}

// ─── DTO PAYLOADS ───

export interface CreateCategoryDto {
  code: string;
  name: string;
  description?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string | null;
}

export interface CreateCategoryValueDto {
  code: string;
  label: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryValueDto {
  code?: string;
  label?: string;
  isActive?: boolean;
  sortOrder?: number;
}

// ─── MUTATION PARAMETERS (FOR QUERY HOOKS) ───

export interface UpdateCategoryMutationParams {
  id: string | number;
  payload: UpdateCategoryDto;
}

export interface CreateCategoryValueMutationParams {
  categoryId: string | number;
  payload: CreateCategoryValueDto;
}

export interface UpdateCategoryValueMutationParams {
  id: string | number;
  categoryId?: string | number;
  payload: UpdateCategoryValueDto;
}

export interface DeleteCategoryValueMutationParams {
  id: string | number;
  categoryId?: string | number;
}

// ─── API RESPONSES ───

export interface CategoryApiResponse {
  success: boolean;
  message?: string;
  data?: CategoryItem;
}

export interface CategoriesApiResponse {
  success: boolean;
  message?: string;
  data?: CategoryItem[];
}

export interface CategoryValuesApiResponse {
  success: boolean;
  message?: string;
  data?: CategoryValueItem[];
}

export interface CategoryValueApiResponse {
  success: boolean;
  message?: string;
  data?: CategoryValueItem;
}
