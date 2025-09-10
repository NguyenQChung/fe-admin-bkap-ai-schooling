import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");

    if (!token) {
        // 🚨 Nếu chưa login thì chuyển về trang signin
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
}
