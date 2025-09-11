import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const token = localStorage.getItem("token");

    if (!token) {
        return <Navigate to="/signin" replace />;
    }

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // decode JWT payload
        const isExpired = payload.exp * 1000 < Date.now(); // exp tính bằng giây

        if (isExpired) {
            localStorage.removeItem("token"); // clear token hết hạn
            return <Navigate to="/signin" replace />;
        }
    } catch (e) {
        // nếu token không hợp lệ thì cũng redirect
        localStorage.removeItem("token");
        return <Navigate to="/signin" replace />;
    }

    return <>{children}</>;
}
