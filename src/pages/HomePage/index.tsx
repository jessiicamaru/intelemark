import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CenterLayout from '@/layouts/CenterLayout';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseGoogleDate } from '@/utils/parseDateFromSheet';

const SHEET_ID = '1ynFiLcRkXdN9iiEhoIDNQ1oKDc_EnMj8crtN2ZZWYa4';

interface ExamCode {
    exam_code_id: string;
    assignments_id: string;
    code_label: string;
}

interface Question {
    question_id: string;
    exam_code_id: string;
    type: string;
    question_content: string;
    points: number;
    [key: string]: any;
}

interface Assignment {
    assignments_id: string;
    title: string;
    subject: string;
    start_at: string;
    end_at: string;
    max_attempts: string;
    status: string;
}

interface Exam {
    assignment: Assignment;
    examCodes: ExamCode[];
    questions: Question[];
}

async function getSheet(sheetName: string) {
    try {
        const res = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${sheetName}`);
        const text = await res.text();
        const json = JSON.parse(text.substr(47).slice(0, -2));
        const rawRows = json.table.rows.map((r: any) => r.c.map((c: any) => c?.v ?? ''));

        if (rawRows.length === 0) return [];

        const header =
            json.table.cols.every((c: any) => !c.label) || json.table.cols.length === 0 ? rawRows[0] : json.table.cols.map((c: any) => c.label || '');

        const dataRows = json.table.cols.every((c: any) => !c.label) || json.table.cols.length === 0 ? rawRows.slice(1) : rawRows;

        const rows = dataRows.map((row: any[]) => Object.fromEntries(header.map((col: string, i: number) => [col, row[i] ?? ''])));

        return rows;
    } catch (err) {
        console.error('Lỗi khi load sheet:', err);
        return [];
    }
}

const HomePage = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState<Exam[]>([]);

    const handleLogout = () => {
        localStorage.removeItem('student_id');
        localStorage.removeItem('student_name');
        navigate('/login');
    };

    const name = localStorage.getItem('student_name');

    useEffect(() => {
        (async () => {
            const [examCodes, questions, assignments] = await Promise.all([getSheet('EXAM_CODES'), getSheet('QUESTIONS'), getSheet('ASSIGNMENTS')]);

            // Gộp dữ liệu: assignment → examCodes → questions
            const combined: Exam[] = (assignments as Assignment[]).map((a) => ({
                assignment: a,
                examCodes: (examCodes as ExamCode[]).filter((e) => e.assignments_id === a.assignments_id),
                questions: (questions as Question[]).filter((q) =>
                    (examCodes as ExamCode[]).filter((e) => e.assignments_id === a.assignments_id).some((e) => e.exam_code_id === q.exam_code_id)
                ),
            }));

            setExams(combined);
            console.log('🧩 Exams:', combined);
        })();
    }, []);

    return (
        <CenterLayout>
            <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-2xl font-bold">Welcome {name}</h1>
                    <Button onClick={handleLogout} variant="outline">
                        Logout
                    </Button>
                </div>

                {/* Hiển thị các bài thi có status = 'open' */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {exams
                        .filter((exam) => exam.assignment.status === 'open')
                        .map((exam) => (
                            <Card key={exam.assignment.assignments_id} className="hover:shadow-lg transition-shadow duration-200">
                                <CardHeader>
                                    <CardTitle>{exam.assignment.title}</CardTitle>
                                    <CardDescription>
                                        {exam.assignment.subject} —{' '}
                                        <span className="font-semibold text-green-600">{exam.assignment.status.toUpperCase()}</span>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 mb-2">
                                        Thời gian: {parseGoogleDate(exam.assignment.start_at)} → {parseGoogleDate(exam.assignment.end_at)}
                                    </p>

                                    <p className="text-sm text-gray-600 mb-2">
                                        Số đề: {exam.examCodes.length} | Tổng số câu hỏi: {exam.questions.length}
                                    </p>
                                    <Button
                                        className="mt-2 w-full"
                                        variant="default"
                                        onClick={() => navigate(`/exam/${exam.assignment.assignments_id}`, { state: { exam } })}
                                    >
                                        Vào làm bài
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </div>
        </CenterLayout>
    );
};

export default HomePage;
