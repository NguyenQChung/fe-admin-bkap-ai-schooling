import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import { Edit, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog"
import Button from '../../components/ui/button/Button';
import withReactContent from "sweetalert2-react-content";
import Swal from "sweetalert2";
import axios from "axios";

interface Teacher {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  homeroomClassName?: string;
  schoolName?: string;
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [currentPage, setCurrentPage] = useState(1);
  const teacherPerPage = 10;

  // Phân trang
  const indexOfLastTeacher = currentPage * teacherPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teacherPerPage;
  const currentTeacher = teachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
  const totalPages = Math.ceil(teachers.length / teacherPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Fetch danh sách teacher
  useEffect(() => {
    fetch(`${API_URL}/teachers`)
      .then((res) => res.json())
      .then((data: Teacher[]) => setTeachers(data))
      .catch((err) => console.error("Error fetching teachers:", err));
  }, []);

  // Xoa Class
  const MySwal = withReactContent(Swal);
  const handleDelete = async (id: number) => {
    const result = await MySwal.fire({
      title: "Bạn có chắc muốn xoá?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xoá",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/teachers/${id}`);
        setTeachers((prev) => prev.filter((s) => s.id !== id));
        MySwal.fire("Đã xoá!", "Lớp đã được xoá thành công.", "success");
      } catch (err: any) {
        MySwal.fire("Thất bại", "Không thể xoá lớp.", "error");
      }
    }
  };

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Họ và Tên</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số điện thoại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lớp Chủ Nhiệm</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trường</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentTeacher.length > 0 ? (
                currentTeacher.map((tch) => (
                  <tr key={tch.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{tch.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tch.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tch.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tch.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tch.homeroomClassName || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{tch.schoolName || "—"}</td>
                    <td className="px-2 py-4 text-left">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(tch)}
                          className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">
                          <Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(tch.id)}
                          className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-4">Không có giáo viên nào</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white text-blue-500"}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </ComponentCard>
      </div>


    </>
  );
}
