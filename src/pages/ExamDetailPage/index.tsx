import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';
import ExamImageUploader from '@/components/ExamImageUploader';
import { parseGoogleDate } from '@/utils/parseDateFromSheet';

type Question = {
    question_id: string;
    exam_code_id: string;
    type: 'E' | 'SA' | 'MCQ';
    question_content: string;
    points: number;
    options_json?: string;
};

const ExamDetailPage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { assignment, examCodes, questions } = state.exam || {};
    const exam = examCodes?.[0];

    console.log(state.exam);

    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const studentId = localStorage.getItem('student_id') || 'unknown';

    const handleChange = (questionId: string, value: string) => {
        setAnswers((prev) => ({ ...prev, [questionId]: value }));
    };

    const handleImageChange = (questionId: string, urls: string[]) => {
        handleChange(questionId, JSON.stringify(urls));
    };

    const submitExam = async () => {
        if (!questions || !exam) return;

        setIsSubmitting(true);

        const submissionContent: any = {
            essay: {},
            short: {},
            mcq: {},
        };

        questions.forEach((q: Question) => {
            const ans = answers[q.question_id] || '';

            if (q.type === 'E') {
                try {
                    const urls: string[] = ans ? JSON.parse(ans) : [];
                    submissionContent.essay[q.question_id] = urls[0] || '';
                } catch {
                    submissionContent.essay[q.question_id] = '';
                }
            } else if (q.type === 'SA') {
                submissionContent.short[q.question_id] = ans.trim();
            } else if (q.type === 'MCQ') {
                submissionContent.mcq[q.question_id] = ans || '';
            }
        });

        const payload = {
            submission_id: `SUB-${assignment?.assignments_id}-${Date.now()}`, // hoặc để backend sinh
            student_id: studentId,
            type: 'mix',
            exam_code_id: exam.exam_code_id,
            submission_content: submissionContent,
        };

        console.log('Payload gửi lên server:', payload);

        try {
            const response = await fetch('https://vcoch.app.n8n.cloud/webhook/ai4life/submission', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                navigate('/exam/result', { state: { result, questions, submissionContent: submissionContent } });
            } else {
                const err = await response.text();
                alert('Lỗi: ' + err);
            }
        } catch (err) {
            console.error(err);
            alert('Không thể kết nối server!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <CenterLayout>
            <div className="w-full max-w-3xl space-y-6">
                {/* Header */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold">{assignment?.title}</CardTitle>
                        <p className="text-gray-600">{assignment?.subject}</p>
                        <div className="text-sm text-gray-500 space-y-1">
                            <p>Bắt đầu: {parseGoogleDate(assignment?.start_at)}</p>
                            <p>Kết thúc: {parseGoogleDate(assignment?.end_at)}</p>
                        </div>
                        <p className="font-medium text-blue-600 mt-2">Mã đề: {exam?.code_label}</p>
                    </CardHeader>
                </Card>

                {/* Questions */}
                {questions?.map((q: Question, idx: number) => {
                    // Parse options chỉ 1 lần, an toàn
                    let options: { label: string; text: string }[] = [];
                    if (q.type === 'MCQ' && q.options_json) {
                        try {
                            options = JSON.parse(q.options_json);
                        } catch (e) {
                            console.error('Parse options error:', q.options_json);
                        }
                    }

                    const currentAnswer = answers[q.question_id] || '';

                    return (
                        <Card key={q.question_id} className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex justify-between items-start text-lg">
                                    <span className="font-bold text-primary">Câu {idx + 1}</span>
                                    <span className="text-sm font-medium text-gray-500">{q.points} điểm</span>
                                </CardTitle>
                                <p className="mt-2 text-base">{q.question_content}</p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Essay */}
                                {q.type === 'E' && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700 mb-3">Vui lòng chụp ảnh bài làm (giấy viết tay)</p>
                                        <ExamImageUploader
                                            value={currentAnswer ? JSON.parse(currentAnswer) : []}
                                            onChange={(urls) => handleImageChange(q.question_id, urls)}
                                        />
                                    </div>
                                )}

                                {/* Short Answer */}
                                {q.type === 'SA' && (
                                    <Textarea
                                        placeholder="Nhập câu trả lời của bạn..."
                                        rows={4}
                                        value={currentAnswer}
                                        onChange={(e) => handleChange(q.question_id, e.target.value)}
                                    />
                                )}

                                {/* Multiple Choice */}
                                {q.type === 'MCQ' && (
                                    <RadioGroup value={currentAnswer} onValueChange={(val) => handleChange(q.question_id, val)}>
                                        {options.length > 0 ? (
                                            options.map((opt) => (
                                                <div key={opt.label} className="flex items-start space-x-3 py-3">
                                                    <RadioGroupItem value={opt.label} id={`${q.question_id}-${opt.label}`} />
                                                    <Label
                                                        htmlFor={`${q.question_id}-${opt.label}`}
                                                        className="cursor-pointer text-base leading-relaxed flex-1"
                                                    >
                                                        <span className="font-bold text-primary">{opt.label}.</span> {opt.text}
                                                    </Label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-red-500">Lỗi tải đáp án</p>
                                        )}
                                    </RadioGroup>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                {/* Submit */}
                <div className="flex justify-end pt-8 pb-10">
                    <Button size="lg" onClick={submitExam} disabled={isSubmitting} className="min-w-40">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                Đang nộp...
                            </>
                        ) : (
                            'Nộp bài'
                        )}
                    </Button>
                </div>
            </div>
        </CenterLayout>
    );
};

export default ExamDetailPage;
