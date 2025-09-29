import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Edit, Trash2, Plus, Lock, Unlock } from "lucide-react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../../components/ui/dialog";
import Button from "../../components/ui/button/Button";
import SearchSortTable, { SortOption } from "../../components/tables/SearchSortTable";

interface User {
    id: number;
    username: string | null;
    email: string | null;
    role: string;
    isActive: boolean;
    createdAt: string;
}

// Danh sách role từ CSDL
const USER_ROLES = [
    { value: "PARENT", label: "Phụ huynh" },
    { value: "SCHOOL_ADMIN", label: "Quản trị trường học" },
    { value: "STUDENT", label: "Học sinh" },
    { value: "TEACHER", label: "Giáo viên" },
    { value: "SYSTEM_ADMIN", label: "Quản trị hệ thống" },
];

// Hàm định dạng role để hiển thị
const formatRole = (role: string) => {
    const roleObj = USER_ROLES.find((r) => r.value === role);
    return roleObj ? roleObj.label : role;
};

// Helper token
const getJwtToken = (token: string | null): string | null => {
    if (!token) return null;
    try {
        const parsedToken = JSON.parse(token);
        return parsedToken.token || token;
    } catch {
        return token;
    }
};

// Lấy userId từ token
const getUserIdFromToken = (token: string | null): number | null => {
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.userId || null;
    } catch {
        return null;
    }
};

export default function UserPage() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const navigate = useNavigate();
    const MySwal = withReactContent(Swal);
    const usersPerPage = 10;

    // Fetch users
    useEffect(() => {
        const token = localStorage.getItem("token");
        const jwtToken = getJwtToken(token);
        if (!jwtToken) {
            navigate("/signin");
            return;
        }
        setIsLoading(true);
        fetch(`${API_URL}/user`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP error! ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setUsers(Array.isArray(data) ? data : data.content || []);
                setFilteredUsers(Array.isArray(data) ? data : data.content || []);
            })
            .catch((err) => {
                console.error("❌ Error fetching users:", err);
                setMessage({ type: "error", text: `❌ Không thể tải danh sách tài khoản: ${err.message}` });
            })
            .finally(() => setIsLoading(false));
    }, [navigate]);

    // Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);

    // Delete user
    const handleDelete = async (id: number) => {
        const result = await MySwal.fire({
            title: "Bạn có chắc muốn xóa?",
            text: "Hành động này không thể hoàn tác!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Xóa",
            cancelButtonText: "Hủy",
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem("token");
            const jwtToken = getJwtToken(token);
            const actorId = getUserIdFromToken(jwtToken);
            if (!jwtToken || !actorId) throw new Error("Không tìm thấy token hoặc ID người dùng");

            setIsLoading(true);
            const res = await fetch(`${API_URL}/user/${id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    "X-User-Id": actorId.toString(),
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                if (res.status === 403) {
                    throw new Error(errorData.message || "Bạn không có quyền xóa người dùng");
                } else if (res.status === 404) {
                    throw new Error(errorData.message || "Không tìm thấy người dùng");
                } else {
                    throw new Error(errorData.message || "Xóa thất bại");
                }
            }

            setUsers((prev) => prev.filter((u) => u.id !== id));
            setFilteredUsers((prev) => prev.filter((u) => u.id !== id));
            MySwal.fire("Thành công", "Xóa tài khoản thành công", "success");
        } catch (err: any) {
            MySwal.fire("Lỗi", `Không thể xóa tài khoản: ${err.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Toggle active
    const handleToggleActive = async (user: User) => {
        try {
            const token = localStorage.getItem("token");
            const jwtToken = getJwtToken(token);
            const actorId = getUserIdFromToken(jwtToken);
            if (!jwtToken || !actorId) throw new Error("Không tìm thấy token hoặc ID người dùng");

            setIsLoading(true);
            const action = user.isActive ? "deactivate" : "activate";
            const res = await fetch(`${API_URL}/user/${user.id}/${action}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    "X-User-Id": actorId.toString(),
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Cập nhật trạng thái thất bại");
            }

            setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
            );
            setFilteredUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, isActive: !u.isActive } : u))
            );
            MySwal.fire("Thành công", "Cập nhật trạng thái thành công", "success");
        } catch (err: any) {
            MySwal.fire("Lỗi", `Không thể cập nhật trạng thái: ${err.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Resend email
    const handleResendEmail = async (id: number) => {
        const result = await MySwal.fire({
            title: "Gửi lại email thông tin tài khoản?",
            text: "Hành động này sẽ gửi lại email chứa thông tin tài khoản đến người dùng.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Gửi",
            cancelButtonText: "Hủy",
        });

        if (!result.isConfirmed) return;

        try {
            const token = localStorage.getItem("token");
            const jwtToken = getJwtToken(token);
            const actorId = getUserIdFromToken(jwtToken);
            if (!jwtToken || !actorId) throw new Error("Không tìm thấy token hoặc ID người dùng");

            setIsLoading(true);
            const res = await fetch(`${API_URL}/user/${id}/resend-email`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${jwtToken}`,
                    "X-User-Id": actorId.toString(),
                },
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Gửi lại email thất bại");
            }

            MySwal.fire("Thành công", "Email đã được gửi lại thành công", "success");
        } catch (err: any) {
            MySwal.fire("Lỗi", `Không thể gửi lại email: ${err.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Save edit user
    const handleSaveEdit = async () => {
        if (!editingUser) return;
        try {
            const token = localStorage.getItem("token");
            const jwtToken = getJwtToken(token);
            const actorId = getUserIdFromToken(jwtToken);
            if (!jwtToken || !actorId) throw new Error("Không tìm thấy token hoặc ID người dùng");

            setIsLoading(true);
            const res = await fetch(`${API_URL}/user/${editingUser.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${jwtToken}`,
                    "X-User-Id": actorId.toString(),
                },
                body: JSON.stringify({
                    ...editingUser,
                    username: editingUser.username || null,
                    email: editingUser.email || null,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || "Cập nhật thất bại");
            }

            const updatedUser = await res.json();
            setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)));
            setFilteredUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updatedUser : u)));
            setEditingUser(null);
            MySwal.fire("Thành công", "Cập nhật tài khoản thành công", "success");
        } catch (err: any) {
            MySwal.fire("Lỗi", `Không thể cập nhật tài khoản: ${err.message}`, "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Search/sort config
    const sortOptions: SortOption<User>[] = [
        { label: "Tên A-Z", value: "usernameAsc", sorter: (a, b) => (a.username || "").localeCompare(b.username || "") },
        { label: "Tên Z-A", value: "usernameDesc", sorter: (a, b) => (b.username || "").localeCompare(a.username || "") },
        { label: "Role", value: "role", sorter: (a, b) => a.role.localeCompare(b.role) },
    ];
    const getSearchField = (u: User) => `${u.username || ""} ${u.email || ""} ${u.role}`;

    return (
        <>
            <PageMeta title="Quản lý Tài khoản" description="Danh sách tài khoản người dùng" />
            <PageBreadcrumb pageTitle="Quản lý Tài khoản" />
            <ComponentCard title="Danh sách Tài khoản">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Quản lý tài khoản</h2>
                    <Button
                        variant="primary"
                        onClick={() => navigate("/add-user")}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Thêm tài khoản
                    </Button>
                </div>

                {message && (
                    <div
                        className={`p-2 rounded-md border ${
                            message.type === "error"
                                ? "text-red-700 bg-red-100 border-red-300"
                                : "text-green-700 bg-green-100 border-green-300"
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {isLoading ? (
                    <div className="text-center py-4">Đang tải...</div>
                ) : (
                    <>
                        <SearchSortTable
                            data={users}
                            onChange={setFilteredUsers}
                            getSearchField={getSearchField}
                            sortOptions={sortOptions}
                        />
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">STT</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Trạng thái</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {currentUsers.map((user, index) => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 text-sm">{indexOfFirstUser + index + 1}</td>
                                            <td className="px-6 py-4 text-sm">{user.username || "Chưa có"}</td>
                                            <td className="px-6 py-4 text-sm">{user.email || "Chưa có"}</td>
                                            <td className="px-6 py-4 text-sm">{formatRole(user.role)}</td>
                                            <td className="px-6 py-4 text-sm">
                                                {user.isActive ? "Hoạt động" : "Bị khóa"}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/user/${user.id}`)}
                                                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                                                    >
                                                        <Edit className="mr-1 h-4 w-4" /> Sửa
                                                    </button>
                                                    <button
                                                        onClick={() => handleToggleActive(user)}
                                                        className={`px-3 py-1 text-sm text-white rounded-lg flex items-center ${
                                                            user.isActive
                                                                ? "bg-red-500 hover:bg-red-600"
                                                                : "bg-green-500 hover:bg-green-600"
                                                        }`}
                                                    >
                                                        {user.isActive ? (
                                                            <Lock className="mr-1 h-4 w-4" />
                                                        ) : (
                                                            <Unlock className="mr-1 h-4 w-4" />
                                                        )}
                                                        {user.isActive ? "Khóa" : "Mở"}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                                                    >
                                                        <Trash2 className="mr-1 h-4 w-4" /> Xóa
                                                    </button>
                                                    <button
                                                        onClick={() => handleResendEmail(user.id)}
                                                        className="px-3 py-1 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center"
                                                    >
                                                        <svg
                                                            className="mr-1 h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                            xmlns="http://www.w3.org/2000/svg"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth="2"
                                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                            ></path>
                                                        </svg>
                                                        Gửi 
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-center mt-4 space-x-2">
                            {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => handlePageChange(i + 1)}
                                    className={`px-3 py-1 border rounded-lg ${
                                        currentPage === i + 1
                                            ? "bg-blue-500 text-white"
                                            : "bg-white text-blue-500 border-gray-300"
                                    }`}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </ComponentCard>

            {/* Edit user dialog */}
            <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={editingUser?.username || ""}
                            onChange={(e) =>
                                setEditingUser({ ...editingUser!, username: e.target.value || null })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholder="Username"
                        />
                        <input
                            type="email"
                            value={editingUser?.email || ""}
                            onChange={(e) =>
                                setEditingUser({ ...editingUser!, email: e.target.value || null })
                            }
                            className="w-full border rounded-lg px-3 py-2 text-sm"
                            placeholder="Email"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingUser(null)}>
                            Hủy
                        </Button>
                        <Button variant="primary" onClick={handleSaveEdit}>
                            Lưu
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}