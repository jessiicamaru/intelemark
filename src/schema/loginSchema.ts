import { z } from 'zod';

export const loginSchema = z.object({
    studentId: z.string().trim().min(1, 'Student ID is required'),
    password: z.string().trim().min(1, 'Password is required'),
});

export type LoginFormInputs = z.infer<typeof loginSchema>;
