import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import SearchSortTable, { SortOption } from "../../components/tables/SearchSortTable";
import Button from "../../components/ui/button/Button";

interface AuditLog {
    id: number;
    userId: number;
    action: string;
    targetTable: string;
    targetId: number;
    details: string;
    createdAt: string;
}

const getJwtToken = (token: string | null): string | null => {
    if (!token) return null;
    try {
        const parsedToken = JSON.parse(token);
        return parsedToken.token || token;
    } catch (e) {
        return token;
    }
};

export default function AuditLogPage() {
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
    const navigate = useNavigate();
    const logsPerPage = 10;

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    useEffect(() => {
        setIsLoading(true);
        const token = localStorage.getItem("token");
        const jwtToken = getJwtToken(token);
        if (!jwtToken) {
            setMessage({ type: "error", text: "❌ Token không hợp lệ!" });
            navigate("/signin");
            return;
        }

        fetch(`${API_URL}/audit-logs/by-table/schools`, {
            headers: { Authorization: `Bearer ${jwtToken}` },
        })
            .then((res) => {
                if (!res.ok) {
                    if (res.status === 401) {
                        localStorage.removeItem("token");
                        setMessage({ type: "error", text: "❌ Phiên đăng nhập hết hạn!" });
                        navigate("/signin");
                    }
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                setLogs(data);
                setFilteredLogs(data);
            })
            .catch((err) => {
                console.error("Error fetching logs:", err);
                setMessage({ type: "error", text: `❌ Lỗi: ${err.message || "Không thể tải log!"}` });
            })
            .finally(() => setIsLoading(false));
    }, [navigate]);

    // Pagination
    const indexOfLast = currentPage * logsPerPage;
    const indexOfFirst = indexOfLast - logsPerPage;
    const currentLogs = filteredLogs.slice(indexOfFirst, indexOfLast);
    const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

    const handlePageChange = (page: number) => setCurrentPage(page);

    // Sort options
    const sortOptions: SortOption<AuditLog>[] = [
        {
            label: "Mới nhất",
            value: "newest",
            sorter: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        },
        {
            label: "Cũ nhất",
            value: "oldest",
            sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        },
    ];

    const getSearchField = (item: AuditLog) =>
        `${item.action} ${item.targetTable} ${item.details} ${item.userId}`;

    return (
        <>
            <PageMeta title="Audit Log" description="Danh sách Audit Log" />
            <PageBreadcrumb pageTitle="Audit Logs" />
            <div className="space-y-6">
                <ComponentCard title="Lịch sử thao tác">
                    {message && (
                        <div
                            className={`p-2 rounded-md border ${message.type === "error"
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
                                data={logs}
                                onChange={setFilteredLogs}
                                getSearchField={getSearchField}
                                sortOptions={sortOptions}
                            />
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium">STT</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium">Người dùng</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium">Hành động</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium">Bảng</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium">Chi tiết</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium">Thời gian</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                                        {currentLogs.length > 0 ? (
                                            currentLogs.map((log, index) => (
                                                <tr key={log.id}>
                                                    <td className="px-6 py-4 text-sm">{indexOfFirst + index + 1}</td>
                                                    <td className="px-6 py-4 text-sm">{log.userId}</td>
                                                    <td className="px-6 py-4 text-sm">{log.action}</td>
                                                    <td className="px-6 py-4 text-sm">{log.targetTable}</td>
                                                    <td>
                                                        {Object.entries(log.details || {}).map(([key, value]) => (
                                                            <div key={key}>
                                                                <strong>{key}</strong>: {String(value)}
                                                            </div>
                                                        ))}
                                                    </td>


                                                    <td className="px-6 py-4 text-sm">
                                                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="text-center py-4">
                                                    Không có log nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-center mt-4 space-x-2">
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`px-3 py-1 border rounded-lg ${currentPage === i + 1
                                            ? "bg-blue-500 text-white"
                                            : "bg-white dark:bg-gray-800 text-blue-500"
                                            }`}
                                        disabled={isLoading}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </ComponentCard>
            </div>
        </>
    );
}
