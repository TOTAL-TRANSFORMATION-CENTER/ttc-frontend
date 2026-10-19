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

export const loginSchema = z
  .object({
    identifier: z.string().trim().min(1, "Phone number or email is required").optional(),
    phone: z.string().trim().optional(),
    email: z.string().trim().optional(),
    password: z.string().min(1, "Password is required").max(72),
  })
  .refine(
    (data) => Boolean((data.identifier && data.identifier.length > 0) || (data.phone && data.phone.length > 0) || (data.email && data.email.length > 0)),
    {
      message: "Phone number or email is required",
      path: ["identifier"],
    }
  );