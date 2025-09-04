import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function TeachersPage() {
  interface Teacher {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    code: string;
    isActive: boolean;
    createdAt: string;
    homeroomClassId?: number;
    homeroomClassName?: string;
    schoolId?: number;
    schoolName?: string;
  }

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";

  useEffect(() => {
    fetch(`${API_URL}/teachers`)
      .then((res) => res.json())
      .then((data: Teacher[]) => setTeachers(data))
      .catch((err) => console.error("Error fetching teachers:", err));
  }, []);

  return (
    <>
      <PageMeta
        title="Danh sách Giáo viên | TailAdmin"
        description="Trang quản lý danh sách giáo viên"
      />
      <PageBreadcrumb pageTitle="Danh sách Giáo viên" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Giáo viên">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Họ và Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số điện thoại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã GV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lớp Chủ Nhiệm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trường
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.map((tch) => (
                <tr key={tch.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{tch.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tch.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tch.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tch.phone}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tch.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tch.homeroomClassName || "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tch.schoolName || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </ComponentCard>
      </div>
    </>
  );
}
