import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function Student(){
    interface Student {
        id: number;
        fullName: string;
        username: string;
        phone: string;
        birthdate: string;
        hobbies: string;
    }

    const [students, setStudents] = useState<Student[]>([]);
    const API_URL = import.meta.env.VITE_API_URL || "";

    useEffect(() => {
        fetch(`${API_URL}/students`)
            .then((res) => res.json())
            .then((data) => {
                console.log("API /students response:", data);

                if (Array.isArray(data)) {
                    setStudents(data);
                } else if (data && Array.isArray(data.content)) {
                    setStudents(data.content);
                } else {
                    console.error("Unexpected API format:", data);
                    setStudents([]);
                }
            })
            .catch((err) => console.error("Error fetching students:", err));
    }, []);
    function formatDate(dateStr: string): string {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr; // Nếu parse fail thì trả lại y nguyên

        return d.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }


    return (
        <>
            <PageMeta
                title="Danh sách học sinh"
                description="Quản lý học sinh trong hệ thống"
            />
            <PageBreadcrumb pageTitle="Students" />
            <div className="space-y-6">
                <ComponentCard title="Danh sách Học sinh">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Họ tên
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Điện thoại
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ngày sinh
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Sở thích
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? (
                                students.map((s) => (
                                    <tr key={s.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{s.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{s.fullName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{s.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{s.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{formatDate(s.birthdate)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{s.hobbies}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-4">
                                        No students found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </ComponentCard>
            </div>
        </>
    );
}
