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


export default function ClassPage() {
  interface School {
    id: number;
    name: string;
  }


  interface Class {
    id: number;
    name: string;
    schoolId: number;
    schoolName: string;
    schoolAddress: string;
  }

  const [classes, setClasses] = useState<Class[]>([]);
  const API_URL = import.meta.env.VITE_API_URL || "";
  const [currentPage, setCurrentPage] = useState(1);
  const classesPerPage = 10;
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [schoolId, setSchoolId] = useState<number | "">("");
  const [schools, setSchools] = useState<School[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/class`)
      .then((res) => res.json())
      .then((data) => {

        // Nếu backend trả về { data: [...] }
        if (Array.isArray(data)) {
          setClasses(data);
        } else if (data && Array.isArray(data.content)) {
          // Ví dụ backend có phân trang: { content: [...], totalPages: 2 }
          setClasses(data.content);
        } else {
          console.error("Unexpected API format:", data);
          setClasses([]); // fallback an toàn
        }
      })
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  // Tính toán phân trang
  const indexOfLastClass = currentPage * classesPerPage;
  const indexOfFirstClass = indexOfLastClass - classesPerPage;
  const currentClass = classes.slice(indexOfFirstClass, indexOfLastClass);
  const totalPages = Math.ceil(classes.length / classesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
        await axios.delete(`${API_URL}/class/${id}`);
        setClasses((prev) => prev.filter((s) => s.id !== id));
        MySwal.fire("Đã xoá!", "Lớp đã được xoá thành công.", "success");
      } catch (err: any) {
        MySwal.fire("Thất bại", "Không thể xoá lớp.", "error");
      }
    }
  };

  // Mở modal edit
  const handleEdit = (cls: Class) => {
    setEditingClass(cls);
  };

  // Lưu thay đổi
  const handleSaveEdit = async () => {
    if (!editingClass) return;
    try {
      const res = await axios.put(`${API_URL}/class/${editingClass.id}`, editingClass);
      setClasses((prev) =>
        prev.map((s) => (s.id === editingClass.id ? res.data : s))
      );
      setEditingClass(null);
      MySwal.fire("Thành công", "Cập nhật Lớp thành công", "success");
    } catch (err) {
      MySwal.fire("Lỗi", "Không thể cập nhật", "error");
    }
  };

  // load danh sách School để chọn lớp chủ nhiệm
  useEffect(() => {
    fetch(`${API_URL}/schools`)
      .then((res) => res.json())
      .then((data: School[]) => setSchools(data))
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  return (
    <>
      <PageMeta
        title="Danh sách Lớp"
        description="Danh sách lớp học kèm thông tin trường"
      />
      <PageBreadcrumb pageTitle="Danh sách Lớp" />
      <div className="space-y-6">
        <ComponentCard title="Danh sách Lớp">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên Lớp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trường
                </th>
                <th className="w-1/4 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentClass.length > 0 ? (
                currentClass.map((cls, index) => (
                  <tr key={cls.id}>
                    <td className="px-6 py-4 whitespace-nowrap">{indexOfFirstClass + index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{cls.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cls.schoolName}
                    </td>
                    <td className="px-2 py-4 text-left">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(cls)}
                          className="flex items-center px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600">
                          <Edit />
                        </button>
                        <button
                          onClick={() => handleDelete(cls.id)}
                          className="flex items-center px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-600">
                          <Trash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (<tr>
                <td colSpan={4} className="text-center py-4">
                  Không có lớp nào
                </td>
              </tr>)
              }
            </tbody>
          </table>
          <div className="flex justify-center mt-4 space-x-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
                className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-white text-blue-500"
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </ComponentCard>
      </div>


      <Dialog open={!!editingClass} onOpenChange={() => setEditingClass(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Lớp</DialogTitle>
          </DialogHeader>
          <input
            type="text"
            value={editingClass?.name || ""}
            onChange={(e) =>
              setEditingClass({ ...editingClass!, name: e.target.value })
            }
            className="w-full border rounded px-3 py-2 mb-3"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Thuộc Trường
            </label>
            <select
              value={editingClass?.schoolId || ""}
              onChange={(e) =>
                setEditingClass({
                  ...editingClass!,
                  schoolId: e.target.value ? Number(e.target.value) : 0, 
                })
              }
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value="">— Chọn trường —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClass(null)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
