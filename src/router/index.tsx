import { createBrowserRouter } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ProtectedRoute from './ProtectedRoute';
import ExamDetailPage from '@/pages/ExamDetailPage';
import ProtectedResultRoute from './ProtectedResultRoute';
import ExamResultPage from '@/pages/ExamResultPage';

const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <HomePage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/login',
        element: <LoginPage />,
    },
    {
        path: '/register',
        element: <RegisterPage />,
    },
    {
        path: '/exam/:id',
        element: <ExamDetailPage />,
    },
    {
        path: '/exam/result',
        element: (
            <ProtectedRoute>
                <ProtectedResultRoute>
                    <ExamResultPage />
                </ProtectedResultRoute>
            </ProtectedRoute>
        ),
    },
]);

export default router;
