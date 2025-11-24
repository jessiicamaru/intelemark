import { z } from 'zod';

export const registerSchema = z
    .object({
        studentId: z.string().trim().min(1, 'Student ID is required'),
        password: z.string().trim().min(6, 'Password must be at least 6 characters'),
        confirmPassword: z.string().trim().min(1, 'Please confirm your password'),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    });

export type RegisterFormInputs = z.infer<typeof registerSchema>;
