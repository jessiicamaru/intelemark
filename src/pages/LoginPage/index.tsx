'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import CenterLayout from '../../layouts/CenterLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { loginSchema, type LoginFormInputs } from '@/schema/loginSchema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

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

// Giữ nguyên hàm parse Google Sheet như bạn đang dùng
const fetchStudents = async (): Promise<Student[]> => {
    const res = await fetch(API_URL);
    const text = await res.text();
    const jsonText = text.substr(47).slice(0, -2); // google's weird wrapper
    const json: GoogleSheetResponse = JSON.parse(jsonText);

    const rows = json.table.rows.map((r) => r.c.map((c) => c?.v ?? ''));
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const students: Student[] = dataRows.map((row) => {
        const obj: any = {};
        headers.forEach((header: string, i: number) => {
            obj[header.toLowerCase().replace(/\s+/g, '_')] = row[i];
        });
        return obj as Student;
    });

    return students;
};

// Fake teacher (sau này có thể đổi thành check sheet khác)
const TEACHER_EMAIL = 'teacher@example.com';
const TEACHER_PASSWORD = '123456';

const LoginPage = () => {
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);

    // Form cho học sinh
    const studentForm = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
    });

    // Form cho giáo viên (dùng form HTML thuần vì đơn giản)
    const handleTeacherLogin = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoginError(null);

        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        if (email === TEACHER_EMAIL && password === TEACHER_PASSWORD) {
            localStorage.setItem('role', 'teacher');
            localStorage.setItem('teacher_name', 'Giáo viên chủ nhiệm');
            navigate('/teacher-dashboard');
        } else {
            setLoginError('Sai email hoặc mật khẩu giáo viên');
        }
    };

    // Xử lý login học sinh
    const onStudentSubmit = async (data: LoginFormInputs) => {
        setLoginError(null);

        try {
            const students = await fetchStudents();
            const found = students.find((s) => s.student_id === data.studentId && s.student_password === data.password);

            if (found) {
                localStorage.setItem('role', 'student');
                localStorage.setItem('student_id', found.student_id);
                localStorage.setItem('student_name', found.student_name);
                localStorage.setItem('class_id', found.class_id);

                navigate('/'); // hoặc trang làm bài
            } else {
                setLoginError('Mã học sinh hoặc mật khẩu không đúng');
            }
        } catch (err) {
            console.error(err);
            setLoginError('Lỗi tải dữ liệu. Vui lòng thử lại.');
        }
    };

    return (
        <CenterLayout>
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <h1 className="text-3xl font-bold">Đăng nhập hệ thống</h1>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="student" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="student">Học sinh</TabsTrigger>
                            <TabsTrigger value="teacher">Giáo viên</TabsTrigger>
                        </TabsList>

                        {/* ==================== TAB HỌC SINH ==================== */}
                        <TabsContent value="student" className="mt-6">
                            <form onSubmit={studentForm.handleSubmit(onStudentSubmit)} className="space-y-5">
                                <div>
                                    <Label htmlFor="studentId">Mã học sinh</Label>
                                    <Input id="studentId" placeholder="VD: HS001" {...studentForm.register('studentId')} />
                                    {studentForm.formState.errors.studentId && (
                                        <p className="text-red-500 text-sm mt-1">{studentForm.formState.errors.studentId.message}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="password">Mật khẩu</Label>
                                    <Input id="password" type="password" placeholder="Nhập mật khẩu" {...studentForm.register('password')} />
                                    {studentForm.formState.errors.password && (
                                        <p className="text-red-500 text-sm mt-1">{studentForm.formState.errors.password.message}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" disabled={studentForm.formState.isSubmitting}>
                                    {studentForm.formState.isSubmitting ? 'Đang kiểm tra...' : 'Đăng nhập học sinh'}
                                </Button>
                            </form>
                        </TabsContent>

                        {/* ==================== TAB GIÁO VIÊN ==================== */}
                        <TabsContent value="teacher" className="mt-6">
                            <form onSubmit={handleTeacherLogin} className="space-y-5">
                                <div>
                                    <Label htmlFor="email">Email giáo viên</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="teacher@example.com"
                                        defaultValue="teacher@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="teacherPass">Mật khẩu</Label>
                                    <Input id="teacherPass" name="password" type="password" placeholder="123456" defaultValue="123456" required />
                                </div>

                                <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                                    Đăng nhập giáo viên
                                </Button>

                                <p className="text-xs text-center text-gray-500 mt-3">Demo: teacher@example.com / 123456</p>
                            </form>
                        </TabsContent>
                    </Tabs>

                    {/* Thông báo lỗi chung */}
                    {loginError && <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">{loginError}</div>}
                </CardContent>
            </Card>
        </CenterLayout>
    );
};

export default LoginPage;
