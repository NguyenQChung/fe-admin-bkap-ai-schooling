import React, { useState, useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import PageMeta from "../../components/common/PageMeta";

export default function AddSchool() {

  const API_URL = import.meta.env.VITE_API_URL || "";

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const teacherData = {
      name,
      address,
    };

    try {
      const res = await fetch(`${API_URL}/schools`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherData),
      });

      if (!res.ok) throw new Error("Failed to create school");

      alert("Tạo trường học thành công!");
      setName("");
      setAddress("");
    } catch (err) {
      console.error(err);
      alert("Có lỗi khi tạo trường học!");
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
                Địa Chỉ
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1 block w-full border rounded-md px-3 py-2"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Thêm Trường Học
            </button>
          </form>
        </ComponentCard>
      </div>
    </>
  );
}
