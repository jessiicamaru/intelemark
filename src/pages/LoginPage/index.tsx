'use client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CenterLayout from '../../layouts/CenterLayout';
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginSchema, type LoginFormInputs } from '@/schema/loginSchema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SHEET_ID = '1ynFiLcRkXdN9iiEhoIDNQ1oKDc_EnMj8crtN2ZZWYa4';
const SHEET_NAME = 'students';
const API_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

interface Student {
    student_id: string;
    student_name: string;
    student_password: string;
    class_id: string;
}

interface GoogleSheetResponse {
    table: {
        cols: { label: string }[];
        rows: { c: { v: string | null }[] }[];
    };
}

const LoginPage = () => {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    const [loginError, setLoginError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // ---- Hàm fetch dữ liệu sheet và parse thành mảng Student ----
    const fetchStudents = async (): Promise<Student[]> => {
        const res = await fetch(API_URL);
        const text = await res.text();
        const json: GoogleSheetResponse = JSON.parse(text.substr(47).slice(0, -2));

        const rows = json.table.rows.map((r) => r.c.map((c) => c?.v ?? ''));
        const headers = rows[0];
        const dataRows = rows.slice(1);

        // Duyệt từng dòng để tạo object Student
        const students: Student[] = dataRows.map((r) => {
            const obj = Object.fromEntries(r.map((cell, i) => [headers[i], cell]));
            return obj as unknown as Student;
        });

        return students;
    };

    const navigate = useNavigate();

    const onSubmit = async (data: LoginFormInputs) => {
        setLoginError(null);
        setSuccessMsg(null);

        try {
            const students = await fetchStudents();
            const found = students.find((s) => s.student_id === data.studentId && s.student_password === data.password);

            if (found) {
                localStorage.setItem('student_id', found.student_id);
                localStorage.setItem('student_name', found.student_name);

                navigate('/');
            } else {
                setLoginError('❌ Invalid student ID or password');
            }
        } catch (error) {
            console.error(error);
            setLoginError('⚠️ Error fetching student data.');
        }
    };

    return (
        <CenterLayout>
            <Card className="max-h-screen min-w-lg flex items-center justify-center">
                <CardHeader className="w-full text-3xl font-bold">Login page</CardHeader>
                <CardContent className="w-full">
                    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
                        <FieldGroup>
                            <FieldSet>
                                <FieldLegend>Login as a student</FieldLegend>
                                <FieldGroup>
                                    <Field>
                                        <FieldLabel htmlFor="studentId">Student ID</FieldLabel>
                                        <Input
                                            id="studentId"
                                            placeholder="Student ID"
                                            {...register('studentId')}
                                            className={errors.studentId ? 'border-red-500' : ''}
                                        />
                                        {errors.studentId && <p className="text-red-500 text-sm mt-1">{errors.studentId.message}</p>}
                                    </Field>

                                    <Field>
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Input password"
                                            {...register('password')}
                                            className={errors.password ? 'border-red-500' : ''}
                                        />
                                        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                                    </Field>
                                </FieldGroup>
                            </FieldSet>

                            <Field>
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="px-4 hover:bg-black hover:text-white w-full cursor-pointer"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit'}
                                </Button>
                            </Field>
                        </FieldGroup>
                    </form>

                    {/* Result messages */}
                    {loginError && <p className="text-red-500 mt-4">{loginError}</p>}
                    {successMsg && <p className="text-green-600 mt-4">{successMsg}</p>}
                </CardContent>
            </Card>
        </CenterLayout>
    );
};

export default LoginPage;
