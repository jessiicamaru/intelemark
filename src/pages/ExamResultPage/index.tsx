import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, XCircle, AlertCircle, Trophy, Target, MessageSquare, Clock, Award } from 'lucide-react';
import CenterLayout from '@/layouts/CenterLayout';

type ScoringResponse = {
    scores_id: string;
    submission_id: string;
    total_points: number;
    best_so_far: boolean;
    criteria: {
        by_criterion: Record<string, { got: number; count: number }>;
    };
    feedback: {
        summary: string;
        next_actions: string[];
        progress: string;
    };
    details: {
        per_question: Array<{
            question_id: string;
            type: string;
            point: number;
            max_point: number;
            rationale_used?: string;
            criterion_items: Array<{
                criterion: string;
                point: number;
                comment: string;
            }>;
        }>;
    };
    confidence: number;
    scored_at: string;
};

const getScoreColor = (got: number, max: number) => {
    const ratio = got / max;
    if (ratio >= 0.9) return 'text-green-600';
    if (ratio >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
};

const getProgressColor = (progress: string) => {
    if (progress.includes('Tốt') || progress.includes('Xuất sắc')) return 'bg-green-500';
    if (progress.includes('Cần cải thiện') || progress.includes('Yếu')) return 'bg-yellow-500';
    return 'bg-orange-500';
};

export default function ExamResultPage() {
    const { state } = useLocation();
    const [result, setResult] = useState<ScoringResponse | null>(null);
    const [loading, setLoading] = useState(true);

    // Giả lập loading 2-3s (thực tế bạn sẽ fetch từ API hoặc lấy từ state)
    useEffect(() => {
        if (state?.result) {
            setTimeout(() => {
                setResult(state.result);
                setLoading(false);
            }, 2500); // Giả lập AI chấm bài mất thời gian
        } else {
            setLoading(false);
        }
    }, [state]);

    if (loading) {
        return <ResultSkeleton />;
    }

    if (!result) {
        return (
            <CenterLayout>
                <Alert variant="destructive" className="max-w-2xl">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Không tìm thấy kết quả</AlertTitle>
                    <AlertDescription>Vui lòng nộp bài trước khi xem kết quả.</AlertDescription>
                </Alert>
            </CenterLayout>
        );
    }

    const totalGot = result.total_points;
    const totalMax = result.details.per_question.reduce((sum, q) => sum + q.max_point, 0);
    const percentage = Math.round((totalGot / totalMax) * 100);

    return (
        <CenterLayout>
            <div className="w-full max-w-4xl space-y-8 pb-10">
                {/* Header - Điểm tổng */}
                <Card className="border-2 shadow-lg">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            {result.best_so_far ? <Trophy className="w-16 h-16 text-yellow-500" /> : <Award className="w-16 h-16 text-blue-500" />}
                        </div>
                        <CardTitle className="text-4xl font-bold">
                            {totalGot.toFixed(1)} / {totalMax.toFixed(1)}
                        </CardTitle>
                        <p className="text-2xl text-muted-foreground mt-2">{percentage}%</p>

                        <div className="flex justify-center gap-4 mt-4">
                            <Badge variant={result.best_so_far ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                                {result.best_so_far ? 'Điểm cao nhất từ trước đến nay!' : 'Lần nộp tốt'}
                            </Badge>
                            <Badge variant="outline" className="text-lg">
                                <Clock className="w-4 h-4 mr-1" />
                                {new Date(result.scored_at).toLocaleString('vi-VN')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Progress value={percentage} className="h-6" />
                    </CardContent>
                </Card>

                {/* Feedback tổng quan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <MessageSquare className="w-6 h-6 text-blue-600" />
                            Nhận xét tổng quan từ AI
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert className={getProgressColor(result.feedback.progress)}>
                            <Target className="h-5 w-5" />
                            <AlertTitle className="text-lg">Tình trạng học tập: {result.feedback.progress}</AlertTitle>
                            <AlertDescription className="text-base mt-2">{result.feedback.summary}</AlertDescription>
                        </Alert>

                        <div>
                            <p className="font-semibold mb-3 text-lg">Gợi ý cải thiện:</p>
                            <ul className="space-y-2">
                                {result.feedback.next_actions.map((action, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                        <span className="text-muted-foreground">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Chi tiết từng câu */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Chi tiết chấm từng câu</h2>
                    {result.details.per_question.map((q) => {
                        const isCorrect = q.point === q.max_point;
                        const isWrong = q.point === 0;

                        return (
                            <Card key={q.question_id} className="overflow-hidden">
                                <CardHeader className="bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-xl">
                                                {q.question_id} • {q.type === 'MCQ' ? 'Trắc nghiệm' : q.type === 'SA' ? 'Tự luận ngắn' : 'Tự luận'}
                                            </CardTitle>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getScoreColor(q.point, q.max_point)}`}>
                                                {q.point.toFixed(1)} / {q.max_point}
                                            </p>
                                            {isCorrect && (
                                                <Badge className="mt-2" variant="default">
                                                    <CheckCircle2 className="w-4 h-4 mr-1" /> Đúng hoàn toàn
                                                </Badge>
                                            )}
                                            {isWrong && (
                                                <Badge className="mt-2" variant="destructive">
                                                    <XCircle className="w-4 h-4 mr-1" /> Sai
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-6 space-y-4">
                                    {q.criterion_items.length > 0 ? (
                                        <div className="space-y-4">
                                            {q.criterion_items.map((item, i) => (
                                                <div key={i} className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
                                                    <p className="font-semibold">{item.criterion}</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Nhận xét: {item.comment}</p>
                                                    <p className="text-sm font-medium mt-1">Điểm: {item.point.toFixed(1)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : q.rationale_used ? (
                                        <Alert>
                                            <AlertCircle className="h-4 w-4" />
                                            <AlertDescription>
                                                <strong>Lý do chọn đáp án đúng:</strong> {q.rationale_used}
                                            </AlertDescription>
                                        </Alert>
                                    ) : (
                                        <p className="text-muted-foreground italic">Không có nhận xét chi tiết</p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                <div className="flex justify-center gap-4 pt-8">
                    <Button size="lg" onClick={() => window.history.back()}>
                        Quay lại
                    </Button>
                    <Button size="lg" variant="outline">
                        Xem lại bài làm
                    </Button>
                </div>
            </div>
        </CenterLayout>
    );
}

// Loading Skeleton
function ResultSkeleton() {
    return (
        <CenterLayout>
            <div className="w-full max-w-4xl space-y-8">
                <Card>
                    <CardHeader className="text-center">
                        <Skeleton className="h-16 w-16 mx-auto rounded-full" />
                        <Skeleton className="h-12 w-48 mx-auto mt-4" />
                        <Skeleton className="h-8 w-32 mx-auto mt-4" />
                    </CardHeader>
                    <CardContent>
                        <Skeleton className="h-6 w-full" />
                    </CardContent>
                </Card>

                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-8 w-64" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </CenterLayout>
    );
}
