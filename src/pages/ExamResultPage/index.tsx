// ExamResultPage.tsx – PHIÊN BẢN HOÀN CHỈNH & CHẮC CHẮN 100% MAPPING ĐÚNG

import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, AlertCircle, Trophy, Award, MessageSquare, Clock, Image as ImageIcon, FileText, CheckSquare } from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';

type Question = {
    question_id: string;
    type: 'E' | 'SA' | 'MCQ';
    question_content: string;
    points: number;
    answer_key?: string;
    options_json?: string;
};

type SubmissionContent = {
    essay?: Record<string, string>; // Q1 → URL ảnh
    short?: Record<string, string>; // Q2 → text
    mcq?: Record<string, string>; // Q3 → "B"
};

type ScoringResponse = any; // giữ nguyên như cũ

export default function ExamResultPage() {
    const { state } = useLocation();

    // === 1. LẤY DỮ LIỆU CHUẨN ===
    const scoringResult: ScoringResponse = state?.result || null;
    const questions: Question[] = state?.questions || [];

    // Cấu trúc thực tế bạn console.log: submissionContent.submission_content
    const rawSubmission = state?.submissionContent?.submission_content || state?.submissionContent || {};
    const submissionContent: SubmissionContent = {
        essay: rawSubmission.essay || {},
        short: rawSubmission.short || {},
        mcq: rawSubmission.mcq || {},
    };

    if (!scoringResult || questions.length === 0) {
        return (
            <CenterLayout>
                <Alert variant="destructive" className="max-w-2xl">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Lỗi dữ liệu</AlertTitle>
                    <AlertDescription>Không thể hiển thị kết quả. Vui lòng thử lại.</AlertDescription>
                </Alert>
            </CenterLayout>
        );
    }

    const totalGot = scoringResult.total_points;
    const totalMax = questions.reduce((sum, q) => sum + q.points, 0);
    const percentage = Math.round((totalGot / totalMax) * 100);

    // === 2. HELPER FUNCTIONS ===
    const getStudentAnswer = (qid: string) => {
        if (submissionContent.essay?.[qid]) return { type: 'image' as const, value: submissionContent.essay[qid] };
        if (submissionContent.short?.[qid]) return { type: 'text' as const, value: submissionContent.short[qid] };
        if (submissionContent.mcq?.[qid]) return { type: 'mcq' as const, value: submissionContent.mcq[qid] };
        return null;
    };

    const getQuestionDetail = (qid: string) => {
        return scoringResult.details.per_question.find((q: any) => q.question_id === qid);
    };

    const getQuestionTypeDisplay = (type: string) => {
        if (type === 'Essay' || type === 'E') return { label: 'Tự luận', icon: <ImageIcon className="w-6 h-6 text-purple-600" /> };
        if (type === 'ShortAnswer' || type === 'SA') return { label: 'Trả lời ngắn', icon: <FileText className="w-6 h-6 text-blue-600" /> };
        return { label: 'Trắc nghiệm', icon: <CheckSquare className="w-6 h-6 text-green-600" /> };
    };

    const parseOptions = (optionsJson: string) => {
        try {
            return JSON.parse(optionsJson) as { label: string; text: string }[];
        } catch {
            return [];
        }
    };

    // === 3. RENDER ===
    return (
        <CenterLayout>
            <div className="w-full max-w-5xl space-y-8 pb-16">
                {/* Tổng điểm */}
                <Card className="border-2 shadow-xl">
                    <CardHeader className="text-center py-8">
                        <div className="flex justify-center mb-4">
                            {scoringResult.best_so_far ? (
                                <Trophy className="w-20 h-20 text-yellow-500" />
                            ) : (
                                <Award className="w-20 h-20 text-blue-600" />
                            )}
                        </div>
                        <CardTitle className="text-6xl font-extrabold">
                            {totalGot.toFixed(1)}
                            <span className="text-3xl text-gray-500 ml-3">/ {totalMax}</span>
                        </CardTitle>
                        <p className="text-4xl text-muted-foreground mt-2">{percentage}%</p>
                        <div className="flex justify-center gap-6 mt-6">
                            <Badge variant={scoringResult.best_so_far ? 'default' : 'secondary'} className="text-lg px-6 py-2">
                                {scoringResult.best_so_far ? 'Điểm cao nhất từ trước đến nay!' : 'Lần nộp tốt'}
                            </Badge>
                            <Badge variant="outline" className="text-lg px-6 py-2">
                                <Clock className="w-5 h-5 mr-2" />
                                {new Date(scoringResult.scored_at).toLocaleString('vi-VN')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-10 pb-8">
                        <Progress value={percentage} className="h-4" />
                    </CardContent>
                </Card>

                {/* Feedback tổng quan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-2xl">
                            <MessageSquare className="w-8 h-8 text-blue-600" />
                            Nhận xét từ AI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Alert className="bg-yellow-50 border-yellow-300">
                            <AlertTitle className="text-xl">{scoringResult.feedback.progress}</AlertTitle>
                            <AlertDescription className="text-base mt-2">{scoringResult.feedback.summary}</AlertDescription>
                        </Alert>

                        <div>
                            <p className="font-bold text-lg mb-4">Gợi ý cải thiện:</p>
                            <ul className="space-y-3">
                                {scoringResult.feedback.next_actions.map((action: string, i: number) => (
                                    <li key={i} className="flex gap-3">
                                        <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                                        <span className="text-base leading-relaxed">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Chi tiết từng câu */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-center">Chi tiết bài làm</h2>

                    {questions.map((q, idx) => {
                        const studentAns = getStudentAnswer(q.question_id);
                        const detail = getQuestionDetail(q.question_id);
                        if (!detail) return null;

                        const { label: typeLabel, icon: typeIcon } = getQuestionTypeDisplay(q.type);
                        const isCorrect = detail.point === detail.max_point;
                        const options = q.options_json ? parseOptions(q.options_json) : [];

                        return (
                            <Card key={q.question_id} className="overflow-hidden shadow-lg border">
                                <CardHeader className={`py-5 ${isCorrect ? 'bg-green-50' : detail.point === 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
                                    <div className="flex justify-between items-start gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-bold text-primary">Câu {idx + 1}</span>
                                                {typeIcon}
                                                <Badge variant="outline" className="text-sm">
                                                    {typeLabel}
                                                </Badge>
                                                <span className="text-lg font-medium text-gray-600">
                                                    ({detail.point.toFixed(1)} / {detail.max_point} điểm)
                                                </span>
                                            </div>
                                            <p className="mt-3 text-lg font-medium text-gray-800 leading-relaxed">{q.question_content}</p>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-6 space-y-7">
                                    {/* Câu trả lời của học sinh */}
                                    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                                        <p className="font-bold text-blue-900 mb-4 text-lg">Câu trả lời của bạn:</p>

                                        {/* Ảnh tự luận */}
                                        {studentAns?.type === 'image' && (
                                            <div className="flex justify-center">
                                                <img
                                                    src={studentAns.value}
                                                    alt="Bài làm tự luận"
                                                    className="max-w-full rounded-lg shadow-md border border-gray-300"
                                                />
                                            </div>
                                        )}

                                        {/* Trả lời ngắn */}
                                        {studentAns?.type === 'text' && (
                                            <div className="bg-white p-5 rounded-lg border border-gray-300 text-gray-800 whitespace-pre-wrap text-base">
                                                {studentAns.value || <i className="text-gray-400">Không có nội dung</i>}
                                            </div>
                                        )}

                                        {/* Trắc nghiệm */}
                                        {studentAns?.type === 'mcq' && options.length > 0 && (
                                            <div className="space-y-3">
                                                {options.map((opt) => {
                                                    const chosen = opt.label === studentAns.value;
                                                    const correct = opt.label === q.answer_key;

                                                    return (
                                                        <div
                                                            key={opt.label}
                                                            className={`
                                                                flex items-center gap-4 p-4 rounded-lg border-2 font-medium transition-all
                                                                ${
                                                                    correct
                                                                        ? 'bg-green-100 border-green-500 text-green-900'
                                                                        : chosen
                                                                        ? 'bg-red-100 border-red-500 text-red-900'
                                                                        : 'bg-gray-50 border-gray-300 text-gray-600'
                                                                }
                                                            `}
                                                        >
                                                            <span className="text-xl w-10">{opt.label}.</span>
                                                            <span className="flex-1">{opt.text}</span>
                                                            {correct && <CheckCircle2 className="w-6 h-6 text-green-600" />}
                                                            {chosen && !correct && <XCircle className="w-6 h-6 text-red-600" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {!studentAns && <p className="text-red-600 italic">Chưa làm câu này</p>}
                                    </div>

                                    <Separator />

                                    {/* Nhận xét chi tiết */}
                                    {detail.criterion_items?.length > 0 ? (
                                        <div className="space-y-4">
                                            <p className="font-bold text-indigo-900 text-lg">Nhận xét từng tiêu chí:</p>
                                            {detail.criterion_items.map((item: any, i: number) => (
                                                <div
                                                    key={i}
                                                    className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-indigo-200"
                                                >
                                                    <div className="flex justify-between items-start gap-6">
                                                        <div>
                                                            <p className="font-semibold text-indigo-700">{item.criterion}</p>
                                                            <p className="text-gray-700 mt-1.5">{item.comment}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-lg px-4 py-2">
                                                            {item.point.toFixed(1)} điểm
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : detail.rationale_used ? (
                                        <Alert>
                                            <AlertCircle className="h-5 w-5" />
                                            <AlertTitle>Lý do đúng</AlertTitle>
                                            <AlertDescription>{detail.rationale_used}</AlertDescription>
                                        </Alert>
                                    ) : null}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Nút điều hướng */}
                <div className="flex justify-center gap-8 pt-10">
                    <Button variant="outline" size="lg" onClick={() => window.history.back()}>
                        Quay lại
                    </Button>
                </div>
            </div>
        </CenterLayout>
    );
}
