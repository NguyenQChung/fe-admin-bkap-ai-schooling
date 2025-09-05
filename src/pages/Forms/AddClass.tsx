import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";
import Swal from "sweetalert2";


export default function AddClass() {
  interface School {
    id: number;
    name: string;
  }

  const API_URL = import.meta.env.VITE_API_URL || "";

  const [name, setName] = useState("");
  const [schoolId, setSchoolId] = useState<number | "">("");
  const [schools, setSchools] = useState<School[]>([]);

  // load danh sách School để chọn lớp chủ nhiệm
  useEffect(() => {
    fetch(`${API_URL}/schools`)
      .then((res) => res.json())
      .then((data: School[]) => setSchools(data))
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();


    const classData = {
      name,
      schoolId: schoolId || null,
    };

    try {
      const res = await fetch(`${API_URL}/class`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(classData),
      });

      if (!res.ok) throw new Error("Failed to create school");

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "Tạo lớp học thành công!",
        timer: 2000,
        showConfirmButton: false,
      });
      setName("");
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Có lỗi khi tạo lớp học!",
      });
    }
  };

  return (
    <>
      <PageMeta
        title="Thêm Trường Học | TailAdmin"
        description="Trang thêm Trường Học mới"
      />
      <PageBreadcrumb pageTitle="Thêm Trường Học" />
      <div className="space-y-6">
        <ComponentCard title="Thêm Trường Học">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tên Trường
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lớp Chủ nhiệm
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value ? Number(e.target.value) : "")}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              >
                <option value="">— Chọn lớp —</option>
                {schools.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Thêm Lớp Học
            </button>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
