import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

import { Edit, Trash2 } from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../components/ui/dialog"
import Button from '../../components/ui/button/Button';

export default function TeachersPage() {
  interface School {
    id: number;
    name: string;
  }

  interface Class {
    id: number;
    name: string;
  }

  interface Teacher {
    id: number;
    fullName: string;
    email: string;
    phone: string;
    code: string;
    isActive: boolean;
    classId?: number;
    schoolId?: number;
    homeroomClassName?: string;
    schoolName?: string;
  }

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";

  const [currentPage, setCurrentPage] = useState(1);
  const teachersPerPage = 10;

  // Fetch danh sách teachers
  useEffect(() => {
    axios.get(`${API_URL}/teachers`)
      .then(res => setTeachers(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch classes
  useEffect(() => {
    axios.get(`${API_URL}/class`)
      .then(res => setClasses(res.data))
      .catch(err => console.error(err));
  }, []);

  // Fetch schools
  useEffect(() => {
    axios.get(`${API_URL}/schools`)
      .then(res => setSchools(res.data))
      .catch(err => console.error(err));
  }, []);

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
        setTeachers(prev => prev.filter(t => t.id !== id));
        MySwal.fire("Đã xoá!", "Giáo viên đã được xoá.", "success");
      } catch (err) {
        MySwal.fire("Thất bại", "Không thể xoá giáo viên.", "error");
      }
    }
  };

  const handleEdit = (teacher: Teacher) => setEditingTeacher(teacher);

  const handleSaveEdit = async () => {
    if (!editingTeacher) return;
    try {
      const payload = {
        fullName: editingTeacher.fullName,
        email: editingTeacher.email,
        phone: editingTeacher.phone,
        classId: editingTeacher.classId,
      };
      const res = await axios.put(`${API_URL}/teachers/${editingTeacher.id}`, payload);
      setTeachers(prev => prev.map(t => t.id === editingTeacher.id ? res.data : t));
      setEditingTeacher(null);
      MySwal.fire("Thành công", "Cập nhật giáo viên thành công", "success");
    } catch (err) {
      MySwal.fire("Lỗi", "Không thể cập nhật giáo viên", "error");
    }
  };

  // Phân trang
  const indexOfLastTeacher = currentPage * teachersPerPage;
  const indexOfFirstTeacher = indexOfLastTeacher - teachersPerPage;
  const currentTeachers = teachers.slice(indexOfFirstTeacher, indexOfLastTeacher);
  const totalPages = Math.ceil(teachers.length / teachersPerPage);

  return (
    <>
      <PageMeta title="Danh sách Giáo viên" description="Quản lý giáo viên" />
      <PageBreadcrumb pageTitle="Danh sách Giáo viên" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Giáo viên">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Họ và tên</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Số điện thoại</th>
                <th className="px-6 py-3">Lớp chủ nhiệm</th>
                <th className="px-6 py-3">Trường</th>
                <th className="px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentTeachers.length > 0 ? (currentTeachers.map((t, index) => (
                <tr key={t.id}>
                  <td className="px-6 py-4">{indexOfFirstTeacher + index + 1}</td>
                  <td className="px-6 py-4">{t.fullName}</td>
                  <td className="px-6 py-4">{t.email}</td>
                  <td className="px-6 py-4">{t.phone}</td>
                  <td className="px-6 py-4">{t.homeroomClassName || "—"}</td>
                  <td className="px-6 py-4">{t.schoolName || "—"}</td>
                  <td className="px-2 py-4">
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(t)} className="px-3 py-1 bg-blue-500 text-white rounded"><Edit /></button>
                      <button onClick={() => handleDelete(t.id)} className="px-3 py-1 bg-red-500 text-white rounded"><Trash2 /></button>
                    </div>
                  </td>
                </tr>
              ))) : (
                <tr><td colSpan={7} className="text-center py-4">Không có giáo viên</td></tr>
              )}
            </tbody>
          </table>

          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setCurrentPage(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white text-blue-500"}`}>
                {i + 1}
              </button>
            ))}
          </div>
        </ComponentCard>
      </div>

      <Dialog open={!!editingTeacher} onOpenChange={() => setEditingTeacher(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Giáo viên</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={editingTeacher?.fullName || ""}
            onChange={(e) => setEditingTeacher({ ...editingTeacher!, fullName: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <input
            type="text"
            value={editingTeacher?.email || ""}
            onChange={(e) => setEditingTeacher({ ...editingTeacher!, email: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <input
            type="text"
            value={editingTeacher?.phone || ""}
            onChange={(e) => setEditingTeacher({ ...editingTeacher!, phone: e.target.value })}
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Lớp chủ nhiệm</label>
            <select
              value={editingTeacher?.classId || ""}
              onChange={(e) => setEditingTeacher({ ...editingTeacher!, classId: Number(e.target.value) })}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value="">— Chọn lớp —</option>
              {classes.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTeacher(null)}>Hủy</Button>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
