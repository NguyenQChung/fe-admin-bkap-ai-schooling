import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function AddTeacherPage() {
  interface Class {
    id: number;
    name: string;
  }

  const API_URL = import.meta.env.VITE_API_URL || "";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [homeroomClassId, setHomeroomClassId] = useState<number | "">("");

  const [classes, setClasses] = useState<Class[]>([]);

  // load danh sách class để chọn lớp chủ nhiệm
  useEffect(() => {
    fetch(`${API_URL}/class`)
      .then((res) => res.json())
      .then((data: Class[]) => setClasses(data))
      .catch((err) => console.error("Error fetching classes:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const teacherData = {
      fullName,
      email,
      phone,
      code,
      homeroomClass: homeroomClassId ? { id: Number(homeroomClassId) } : null,
    };

    try {
      const res = await fetch(`${API_URL}/teachers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData),
      });

      if (!res.ok) throw new Error("Failed to create teacher");

      alert("Tạo giáo viên thành công!");
      setFullName("");
      setEmail("");
      setPhone("");
      setCode("");
      setHomeroomClassId("");
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi tạo giáo viên!");
    }
  };

  return (
    <>
      <PageMeta
        title="Thêm Giáo viên | TailAdmin"
        description="Trang thêm giáo viên mới"
      />
      <PageBreadcrumb pageTitle="Thêm Giáo viên" />
      <div className="space-y-6">
        <ComponentCard title="Thêm Giáo viên">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Họ và Tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Số điện thoại
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mã Giáo viên
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Lớp Chủ nhiệm
              </label>
              <select
                value={homeroomClassId}
                onChange={(e) => setHomeroomClassId(Number(e.target.value))}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              >
                <option value="">— Chọn lớp —</option>
                {classes.map((cls) => (
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
              Thêm Giáo viên
            </button>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
