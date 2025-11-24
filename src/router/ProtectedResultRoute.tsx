import { Navigate, useLocation } from 'react-router-dom';

const ProtectedResultRoute = ({ children }: { children: React.ReactNode }) => {
    // Kiểm tra xem có kết quả trong location.state không
    // (cách phổ biến nhất khi dùng navigate với state)
    const location = useLocation();

    // Nếu không có state hoặc state.result không tồn tại → redirect về home
    if (!location.state || !(location.state as any)?.result) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedResultRoute;
