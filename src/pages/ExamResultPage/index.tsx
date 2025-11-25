// === ExamResultPage.tsx – PHIÊN BẢN HOÀN HẢO CHO TRẮC NGHIỆM ===

import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    Trophy,
    Target,
    MessageSquare,
    Clock,
    Award,
    Image as ImageIcon,
    FileText,
    CheckSquare,
} from 'lucide-react';
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
    essay?: Record<string, string>;
    short?: Record<string, string>;
    mcq?: Record<string, string>;
};

type ScoringResponse = {
    scores_id: string;
    submission_id: string;
    total_points: number;
    best_so_far: boolean;
    feedback: {
        summary: string;
        next_actions: string[];
        progress: string;
    };
    details: {
        per_question: Array<{
            question_id: string;
            type: 'MCQ' | 'ShortAnswer' | 'Essay';
            point: number;
            max_point: number;
            rationale_used?: string | null;
            criterion_items: Array<{
                criterion: string;
                point: number;
                comment: string;
            }>;
        }>;
    };
    scored_at: string;
};

export default function ExamResultPage() {
    const { state } = useLocation();

    const scoringResult: ScoringResponse | null = state?.result || null;
    const questions: Question[] = state?.questions || [];

    // Fix lỗi submissionContent — bạn đang truyền đúng dạng này rồi
    const submissionContent: SubmissionContent = {
        essay: state?.submissionContent.submission_content?.essay || {},
        short: state?.submissionContent.submission_content?.short || {},
        mcq: state?.submissionContent.submission_content?.mcq || {},
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

    const getAnswerForQuestion = (qid: string) => {
        if (submissionContent.essay?.[qid]) return { type: 'image' as const, value: submissionContent.essay[qid] };
        if (submissionContent.short?.[qid]) return { type: 'text' as const, value: submissionContent.short[qid] };
        if (submissionContent.mcq?.[qid]) return { type: 'mcq' as const, value: submissionContent.mcq[qid] };
        return null;
    };

    const getQuestionDetail = (qid: string) => {
        return scoringResult.details.per_question.find((q) => q.question_id === qid);
    };

    const getQuestionTypeDisplay = (serverType: string) => {
        if (serverType === 'Essay') return { label: 'Tự luận', icon: <ImageIcon className="w-6 h-6 text-purple-600" /> };
        if (serverType === 'ShortAnswer') return { label: 'Ngắn', icon: <FileText className="w-6 h-6 text-blue-600" /> };
        return { label: 'Trắc nghiệm', icon: <CheckSquare className="w-6 h-6 text-green-600" /> };
    };

    const getProgressColor = (progress: string) => {
        if (progress.includes('Tốt') || progress.includes('Xuất sắc')) return 'bg-green-500';
        if (progress.includes('Cần cải thiện') || progress.includes('Yếu')) return 'bg-yellow-600';
        return 'bg-orange-500';
    };

    return (
        <CenterLayout>
            <div className="w-full max-w-4xl space-y-6 pb-12">
                {/* Tổng điểm – nhỏ gọn, tinh tế */}
                <Card className="border-2 shadow-lg">
                    <CardHeader className="text-center py-6">
                        <div className="flex justify-center mb-3">
                            {scoringResult.best_so_far ? (
                                <Trophy className="w-16 h-16 text-yellow-500" />
                            ) : (
                                <Award className="w-16 h-16 text-blue-600" />
                            )}
                        </div>
                        <CardTitle className="text-5xl font-bold">
                            {totalGot.toFixed(1)}
                            <span className="text-2xl text-gray-500 ml-2">/ {totalMax}</span>
                        </CardTitle>
                        <p className="text-3xl text-muted-foreground mt-1">{percentage}%</p>

                        <div className="flex justify-center gap-4 mt-5">
                            <Badge variant={scoringResult.best_so_far ? 'default' : 'secondary'} className="text-sm px-4 py-1.5">
                                {scoringResult.best_so_far ? 'Điểm cao nhất!' : 'Lần nộp tốt'}
                            </Badge>
                            <Badge variant="outline" className="text-sm px-4 py-1.5">
                                <Clock className="w-4 h-4 mr-1.5" />
                                {new Date(scoringResult.scored_at).toLocaleString('vi-VN')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-6">
                        <Progress value={percentage} className="h-3" />
                    </CardContent>
                </Card>

                {/* Nhận xét tổng quan – gọn nhẹ */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                            Nhận xét từ AI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5 text-base">
                        <Alert className={`${getProgressColor(scoringResult.feedback.progress)} text-white border-0`}>
                            <Target className="h-5 w-5" />
                            <AlertTitle className="text-lg">{scoringResult.feedback.progress}</AlertTitle>
                            <AlertDescription className="text-sm mt-1 opacity-95">{scoringResult.feedback.summary}</AlertDescription>
                        </Alert>

                        <div>
                            <p className="font-semibold mb-3">Gợi ý cải thiện:</p>
                            <ul className="space-y-2.5 text-gray-700">
                                {scoringResult.feedback.next_actions.map((action, i) => (
                                    <li key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                        <span className="text-sm leading-relaxed">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Chi tiết từng câu – nhỏ gọn, chuyên nghiệp */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center text-gray-800">Chi tiết bài làm</h2>

                    {questions.map((q, idx) => {
                        const answer = getAnswerForQuestion(q.question_id);
                        const detail = getQuestionDetail(q.question_id);
                        if (!detail) return null;

                        const display = getQuestionTypeDisplay(detail.type);
                        const isCorrect = detail.point === detail.max_point;
                        const studentAnswer = answer?.type === 'mcq' ? answer.value : null;
                        const correctAnswer = q.answer_key;

                        let options: { label: string; text: string }[] = [];
                        if (q.options_json) {
                            try {
                                options = JSON.parse(q.options_json);
                            } catch {
                                //
                            }
                        }

                        return (
                            <Card key={q.question_id} className="border shadow-md">
                                <CardHeader className={`py-4 ${isCorrect ? 'bg-green-50' : detail.point === 0 ? 'bg-red-50' : 'bg-amber-50'}`}>
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-bold text-lg text-primary">Câu {idx + 1}</span>
                                                {display.icon}
                                                <Badge variant="outline" className="text-xs px-2 py-0.5">
                                                    {display.label}
                                                </Badge>
                                            </div>
                                            <p className="text-base font-medium mt-2 leading-snug text-gray-800">{q.question_content}</p>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`text-2xl font-bold ${
                                                    isCorrect ? 'text-green-600' : detail.point === 0 ? 'text-red-600' : 'text-amber-600'
                                                }`}
                                            >
                                                {detail.point.toFixed(1)} / {detail.max_point}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="pt-5 space-y-6 text-sm">
                                    {/* Câu trả lời học sinh */}
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                        <p className="font-semibold text-blue-900 mb-3">Câu trả lời của bạn:</p>

                                        {answer?.type === 'image' && (
                                            <img src={answer.value} alt="Bài làm" className="max-w-full rounded-lg border shadow-sm" />
                                        )}

                                        {answer?.type === 'text' && (
                                            <div className="bg-white p-4 rounded-lg border text-gray-800 whitespace-pre-wrap">
                                                {answer.value || <span className="text-gray-400 italic">Không trả lời</span>}
                                            </div>
                                        )}

                                        {/* Trắc nghiệm – gọn, đẹp, rõ ràng */}
                                        {answer?.type === 'mcq' && options.length > 0 && (
                                            <div className="space-y-2">
                                                {options.map((opt) => {
                                                    const isStudent = opt.label === studentAnswer;
                                                    const isCorrectOpt = opt.label === correctAnswer;

                                                    return (
                                                        <div
                                                            key={opt.label}
                                                            className={`
                                                            flex items-center gap-3 p-3 rounded-lg border transition-all
                                                            ${
                                                                isCorrectOpt
                                                                    ? 'bg-green-100 border-green-400 font-medium text-green-900'
                                                                    : isStudent && !isCorrectOpt
                                                                    ? 'bg-red-100 border-red-400 text-red-800'
                                                                    : 'bg-gray-50 border-gray-300 text-gray-500 opacity-75'
                                                            }
                                                        `}
                                                        >
                                                            <span className="font-bold text-lg w-8">{opt.label}.</span>
                                                            <span className="flex-1">{opt.text}</span>
                                                            {isCorrectOpt && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                                                            {isStudent && !isCorrectOpt && <XCircle className="w-5 h-5 text-red-600" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {!answer && <p className="text-red-600 italic">Chưa làm câu này</p>}
                                    </div>

                                    <Separator />

                                    {/* Nhận xét chi tiết */}
                                    {detail.criterion_items.length > 0 ? (
                                        <div className="space-y-3">
                                            <p className="font-semibold text-blue-900">Nhận xét từng tiêu chí:</p>
                                            {detail.criterion_items.map((item, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200"
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div>
                                                            <p className="font-medium text-indigo-700">{item.criterion}</p>
                                                            <p className="text-gray-700 mt-1 text-sm leading-relaxed">{item.comment}</p>
                                                        </div>
                                                        <Badge variant="secondary" className="text-sm">
                                                            {item.point.toFixed(1)} điểm
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : detail.rationale_used ? (
                                        <Alert className="text-sm">
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertTitle className="text-base">Lý do đáp án đúng</AlertTitle>
                                            <AlertDescription className="mt-1">{detail.rationale_used}</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <p className="text-muted-foreground text-center italic text-sm">Không có nhận xét chi tiết cho câu này.</p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Nút điều hướng – nhỏ gọn */}
                <div className="flex justify-center gap-6 pt-8">
                    <Button variant="outline" onClick={() => window.history.back()} className="px-8">
                        Quay lại danh sách
                    </Button>
                    <Button onClick={() => window.print()} className="px-8">
                        In kết quả
                    </Button>
                </div>
            </div>
        </CenterLayout>
    );
}
