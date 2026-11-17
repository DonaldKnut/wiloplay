import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address.")
  .max(254, "Email is too long.");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password is too long.")
  .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password needs a letter and a number.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60, "Name is too long."),
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit reset code."),
  password: passwordSchema,
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code."),
});

export const searchSchema = z.object({
  query: z.string().trim().max(100, "Search is too long."),
});

export const settingsSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(60),
  city: z.string().trim().max(80, "City name is too long."),
});

export function zodErrorMessage(error: z.ZodError) {
  return error.issues[0]?.message ?? "Please check your input.";
}
