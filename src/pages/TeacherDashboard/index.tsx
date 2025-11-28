'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LogOut, Trophy, TrendingUp, FileText, Users, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SHEET_ID = '1ynFiLcRkXdN9iiEhoIDNQ1oKDc_EnMj8crtN2ZZWYa4';
const API_STUDENTS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=students`;
const API_SUBMISSIONS = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=submissions`;
const API_SCORES = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=scores`;

// === PARSE DATA ===
const parseGoogleSheetData = <T extends Record<string, any>>(text: string, columnMap?: Record<number | string, string>): T[] => {
    const jsonText = text.substr(47).slice(0, -2);
    const data = JSON.parse(jsonText);

    const rawHeaders = data.table.cols.map((col: any, idx: number) => {
        const label = col.label?.trim();
        return label && label !== '' ? label : col.id || `col${idx}`;
    });

    const rows = data.table.rows.map((row: any) => row.c.map((cell: any) => (cell === null || cell === undefined ? '' : cell.v)));

    return rows.map((row: any[]) => {
        const obj: any = {};
        rawHeaders.forEach((header: string, i: number) => {
            let key = columnMap
                ? columnMap[i] || columnMap[header] || header.toLowerCase().replace(/\s+/g, '_')
                : header.toLowerCase().replace(/\s+/g, '_');
            obj[key] = row[i] || '';
        });
        return obj as T;
    });
};

// === INTERFACE ===
interface Student {
    student_id: string;
    student_name: string;
    class_id: string;
}

interface Submission {
    submission_id: string;
    student_id: string;
    exam_code_id: string;
    submitted_at: string;
    attempt_no?: string;
}

interface Score {
    submission_id: string;
    total_points: string;
}

interface Exam {
    exam_code_id: string;
    submissionCount: number;
    studentCount: number;
    latestSubmission: string;
}

// === MAIN COMPONENT ===
export default function TeacherDashboard() {
    const [students, setStudents] = useState<Student[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [scores, setScores] = useState<Score[]>([]);
    const [exams, setExams] = useState<Exam[]>([]);
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // === LOAD DATA ===
    useEffect(() => {
        const fetchAllData = async () => {
            if (localStorage.getItem('role') !== 'teacher') {
                navigate('/login');
                return;
            }

            setLoading(true);
            try {
                const [studentsText, submissionsText, scoresText] = await Promise.all([
                    fetch(API_STUDENTS).then((r) => r.text()),
                    fetch(API_SUBMISSIONS).then((r) => r.text()),
                    fetch(API_SCORES).then((r) => r.text()),
                ]);

                // === STUDENTS ===
                const parsedStudentsRaw = parseGoogleSheetData<Student>(studentsText, {
                    0: 'student_id',
                    1: 'student_name',
                    3: 'class_id',
                });
                const parsedStudents = parsedStudentsRaw.filter(
                    (s) =>
                        s.student_id &&
                        !String(s.student_id).toLowerCase().includes('student_id') &&
                        !String(s.student_name).toLowerCase().includes('student_name')
                );

                // === SUBMISSIONS ===
                const rawSubmissions = parseGoogleSheetData<any>(submissionsText, {
                    0: 'submission_id',
                    1: 'student_id',
                    2: 'exam_code_id',
                    8: 'submitted_at',
                });
                const parsedSubmissions = rawSubmissions.filter(
                    (sub: any) =>
                        sub.exam_code_id &&
                        sub.student_id &&
                        sub.submission_id &&
                        !String(sub.exam_code_id).toLowerCase().includes('exam_code') &&
                        !String(sub.exam_code_id).toLowerCase().includes('exam code') &&
                        !String(sub.submission_id).toLowerCase().includes('submission_id')
                );

                // === SCORES ===
                const rawScores = parseGoogleSheetData<any>(scoresText, {
                    1: 'submission_id',
                    2: 'total_points',
                });
                const parsedScores = rawScores.filter(
                    (sc: any) =>
                        sc.submission_id &&
                        !String(sc.submission_id).toLowerCase().includes('submission_id') &&
                        !String(sc.submission_id).toLowerCase().includes('scores_id')
                );

                // === Tính danh sách đề thi từ submissions đã lọc sạch ===
                const examMap = new Map<string, Exam>();
                parsedSubmissions.forEach((sub) => {
                    const code = sub.exam_code_id || 'UNKNOWN';
                    if (!examMap.has(code)) {
                        examMap.set(code, {
                            exam_code_id: code,
                            submissionCount: 0,
                            studentCount: 0,
                            latestSubmission: sub.submitted_at,
                        });
                    }
                    const exam = examMap.get(code)!;
                    exam.submissionCount++;
                    exam.latestSubmission = sub.submitted_at > exam.latestSubmission ? sub.submitted_at : exam.latestSubmission;
                });

                // Đếm số học sinh duy nhất
                parsedSubmissions.forEach((sub) => {
                    const exam = examMap.get(sub.exam_code_id);
                    if (exam)
                        exam.studentCount = new Set(
                            parsedSubmissions.filter((s) => s.exam_code_id === sub.exam_code_id).map((s) => s.student_id)
                        ).size;
                });

                setStudents(parsedStudents);
                setSubmissions(parsedSubmissions);
                setScores(parsedScores);
                setExams(Array.from(examMap.values()).sort((a, b) => b.latestSubmission.localeCompare(a.latestSubmission)));
            } catch (err) {
                console.error('Lỗi tải dữ liệu:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, [navigate]);

    // === Lấy submissions của 1 học sinh trong 1 đề thi ===
    const getStudentSubmissionsInExam = (studentId: string, examCode: string) => {
        return submissions
            .filter((s) => s.student_id === studentId && s.exam_code_id === examCode)
            .map((sub) => {
                const scoreEntry = scores.find((sc) => sc.submission_id === sub.submission_id);
                const point = scoreEntry ? parseFloat(scoreEntry.total_points || '0') : 0;
                return {
                    submission_id: sub.submission_id,
                    submitted_at: sub.submitted_at,
                    score: isNaN(point) ? 0 : point,
                };
            })
            .sort((a, b) => a.submitted_at.localeCompare(b.submitted_at)) // sắp xếp theo thời gian
            .map((item, index) => ({
                ...item,
                attempt_no: index + 1,
            }));
    };

    // === Dữ liệu biểu đồ ===
    const chartData =
        selectedExam && selectedStudent
            ? getStudentSubmissionsInExam(selectedStudent, selectedExam).map((s) => ({
                  attempt: `Lần ${s.attempt_no}`,
                  score: s.score,
                  date: new Date(s.submitted_at.replace('=', '')).toLocaleDateString('vi-VN'),
              }))
            : [];

    // === Danh sách học sinh đã nộp đề hiện tại ===
    const studentsInCurrentExam = selectedExam
        ? (Array.from(new Set(submissions.filter((s) => s.exam_code_id === selectedExam).map((s) => s.student_id)))
              .map((id) => students.find((s) => s.student_id === id))
              .filter(Boolean) as Student[])
        : [];

    const filteredStudentsInExam = studentsInCurrentExam.filter(
        (s) => (s!.student_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) || (s!.student_id ?? '').includes(searchTerm)
    );

    const selectedStudentData = selectedStudent ? students.find((s) => s.student_id === selectedStudent) : null;

    const studentAttempts = selectedExam && selectedStudent ? getStudentSubmissionsInExam(selectedStudent, selectedExam) : [];

    const bestScore = studentAttempts.length > 0 ? Math.max(...studentAttempts.map((a) => a.score)) : 0;

    const avgScore = studentAttempts.length > 0 ? (studentAttempts.reduce((sum, a) => sum + a.score, 0) / studentAttempts.length).toFixed(2) : '0';

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50">
                <div className="text-xl font-bold">Đang tải dữ liệu chấm bài...</div>
            </div>
        );
    }

    // === GIAO DIỆN CHÍNH: DANH SÁCH ĐỀ THI ===
    if (!selectedExam) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white shadow border-b">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                        <h1 className="text-3xl font-bold text-indigo-700">Dashboard Giáo viên</h1>
                        <Button variant="outline" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                        </Button>
                    </div>
                </div>

                <div className="p-8 max-w-7xl mx-auto">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-indigo-600" />
                        Danh sách đề thi
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => (
                            <Card
                                key={exam.exam_code_id}
                                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-500"
                                onClick={() => setSelectedExam(exam.exam_code_id)}
                            >
                                <CardHeader>
                                    <CardTitle className="text-xl text-indigo-700">{exam.exam_code_id}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <Users className="h-4 w-4" /> Học sinh nộp
                                        </span>
                                        <strong>{exam.studentCount}</strong>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" /> Tổng bài nộp
                                        </span>
                                        <strong>{exam.submissionCount}</strong>
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Cập nhật: {new Date(exam.latestSubmission.replace('=', '')).toLocaleDateString('vi-VN')}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // === GIAO DIỆN CHI TIẾT ĐỀ THI ===
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow border-b">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSelectedExam('');
                                setSelectedStudent('');
                            }}
                        >
                            ← Quay lại
                        </Button>
                        <h1 className="text-3xl font-bold text-indigo-700">Đề: {selectedExam}</h1>
                    </div>
                    <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Đăng xuất
                    </Button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Danh sách học sinh */}
                    <div>
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trophy className="h-5 w-5" />
                                    Học sinh đã nộp ({studentsInCurrentExam.length})
                                </CardTitle>
                                <Input
                                    placeholder="Tìm học sinh..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="mt-3"
                                />
                            </CardHeader>
                            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                                {filteredStudentsInExam.map((s) => {
                                    const attempts = getStudentSubmissionsInExam(s!.student_id, selectedExam);
                                    const latest = attempts[attempts.length - 1];
                                    return (
                                        <div
                                            key={s!.student_id}
                                            onClick={() => setSelectedStudent(s!.student_id)}
                                            className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                                selectedStudent === s!.student_id
                                                    ? 'bg-indigo-100 border-indigo-600 shadow-md'
                                                    : 'hover:bg-gray-50 border-gray-200'
                                            }`}
                                        >
                                            <div className="font-semibold">{s!.student_name}</div>
                                            <div className="text-sm text-gray-600">{s!.student_id}</div>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs bg-gray-200 px-2 py-1 rounded">{attempts.length} lần nộp</span>
                                                {latest && <span className="text-xl font-bold text-indigo-600">{latest.score.toFixed(2)}</span>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Biểu đồ */}
                    <div className="lg:col-span-3 space-y-6">
                        {selectedStudent && selectedStudentData ? (
                            <>
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-2xl">
                                            {selectedStudentData.student_name} ({selectedStudentData.student_id})
                                        </CardTitle>
                                        <div className="flex gap-6 text-lg">
                                            <div className="flex items-center gap-2">
                                                <TrendingUp className="h-5 w-5 text-green-600" />
                                                Điểm cao nhất: <strong className="text-green-600">{bestScore.toFixed(2)}</strong>
                                            </div>
                                            <div>
                                                Trung bình: <strong>{avgScore}/10</strong>
                                            </div>
                                            <div>
                                                Lần nộp: <strong>{studentAttempts.length}</strong>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Tiến trình điểm theo lần nộp</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {chartData.length > 0 ? (
                                            <ResponsiveContainer width="100%" height={420}>
                                                <LineChart data={chartData}>
                                                    <CartesianGrid strokeDasharray="5 5" />
                                                    <XAxis dataKey="attempt" />
                                                    <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} />
                                                    <Tooltip
                                                        formatter={(v: number) => `${v.toFixed(2)} điểm`}
                                                        labelFormatter={(label) => `${label} • ${chartData.find((d) => d.attempt === label)?.date}`}
                                                    />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="score"
                                                        stroke="#8b5cf6"
                                                        strokeWidth={5}
                                                        dot={{ fill: '#8b5cf6', r: 10 }}
                                                        name="Điểm"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <div className="h-96 flex items-center justify-center text-gray-500">Chưa có dữ liệu điểm</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </>
                        ) : (
                            <Card className="h-96 flex items-center justify-center text-gray-500">
                                <div className="text-center">
                                    <Trophy className="h-20 w-20 mx-auto mb-4 opacity-30" />
                                    <p className="text-xl">Chọn một học sinh để xem tiến trình điểm</p>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
