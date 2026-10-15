import { z } from "zod";

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),

  email: z
    .string()
    .trim()
    .max(254)
    .transform((value) => value.toLowerCase())
    .pipe(z.union([z.literal(""), z.email("Invalid email address")]))
    .optional(),

  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number"),

  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .max(72, "Password is too long"),
});

export const loginSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, "Invalid phone number"),

  password: z.string().min(1, "Password is required").max(72),
});