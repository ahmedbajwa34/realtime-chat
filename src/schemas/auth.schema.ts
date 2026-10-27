import { z } from "zod";

export const RegisterSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters"),

    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .max(254, "Email is too long")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password cannot exceed 72 characters"),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;




export const LoginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email address")
        .max(254, "Email is too long")
        .transform((email) => email.toLowerCase()),

    password: z
        .string()
        .min(1, "Password is required")
        .max(72, "Password cannot exceed 72 characters"),
});

export type LoginInput = z.infer<typeof LoginSchema>;
